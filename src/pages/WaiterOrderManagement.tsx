// src/pages/WaiterOrderManagement.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Minus,
  Receipt,
  Search,
  CheckCircle,
  XCircle,
  Save,
  ArrowLeft,
  Trash2,
  Clock,
  ChefHat,
  PanelRightOpen,
  MessageSquare,
  MoreVertical,
  Bike,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalizedName } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VariantSelectionDialog } from "@/components/cashier/VariantSelectionDialog";
import { EditNoteDialog } from "@/components/cashier/EditNoteDialog";
import { useLocation, useNavigate } from "react-router-dom";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { apiService, ApiError } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import {
  APIMenuItem,
  APIOrder,
  MenuItem,
  OrderItem,
  OrderItemStatus,
} from "@/types/restaurant";

interface MenuCategory {
  id: string;
  name: string;
  nameHindi?: string;
}

const mapOrderItemsToCart = (
  orderItems: APIOrder["orderItems"],
  categories: MenuCategory[],
  menuItems: APIMenuItem[]
): OrderItem[] => {
  return orderItems
    .map((item) => {
      // New backend structure: item.menuItemVariant exists and contains menuItem
      const variantSource = item.menuItemVariant;
      if (!variantSource) return null;

      const parent = variantSource.menuItem;
      if (!parent) return null;

      const categoryName =
        categories.find((category) => category.id === parent.categoryId)
          ?.name || "Unknown";

      return {
        id: item.id,
        menuItemVariant: {
          id: variantSource.id,
          name: variantSource.name,
          price: Number(variantSource.price), // <-- FIX: Convert to number
          menuItem: {
            id: parent.id,
            name: parent.name,
            description: parent.description ?? undefined,
            category: categoryName,
            available: parent.isAvailable,
          },
        },
        quantity: item.quantity,
        status: item.status,
        note: item.note,
        paymentStatus: item.paymentStatus,
        price: Number(item.price), // <-- FIX: Convert to number
      } as OrderItem;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

const WaiterOrderManagement: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useWebSocket();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const { language } = useLanguage();

  const [isSending, setIsSending] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<OrderItem | null>(null);

  // Variant selection dialog state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);

  // Note editing dialog state
  const [editingNote, setEditingNote] = useState<{
    itemId: string;
    initialNote?: string;
    itemName: string;
  } | null>(null);

  const { orderId: incomingOrderId, tableId: incomingTableId } =
    location.state || {};

  const currentOrder = orders.find((order) => order.id === incomingOrderId);

  const { execute: executeCategories } = useApi<{ data: MenuCategory[] }>();
  const { execute: executeMenu } = useApi<{ data: APIMenuItem[] }>();
  const { loading: orderLoading, execute: executeOrder } = useApi<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, menuResponse] = await Promise.all([
          executeCategories(() => apiService.getMenuCategories()),
          executeMenu(() => apiService.getMenuItems()),
        ]);

        if (categoriesResponse) setCategories(categoriesResponse.data);
        if (menuResponse)
          setMenuItems(Array.isArray(menuResponse) ? menuResponse : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [executeCategories, executeMenu]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (currentOrder?.orderItems) {
      setCart(
        mapOrderItemsToCart(currentOrder.orderItems, categories, menuItems)
      );
    }
  }, [currentOrder, categories, menuItems]);

  const addToCart = (menuItem: APIMenuItem) => {
    // If single variant, add directly. If multiple, open VariantSelectionDialog.
    if (menuItem.variants.length === 1) {
      handleVariantSelect(menuItem.variants[0].id, menuItem.id);
    } else {
      setSelectedItemId(menuItem.id);
      setVariantDialogOpen(true);
    }
  };

  const handleVariantSelect = (
    variantId: string,
    originatingItemId?: string
  ) => {
    const itemId = originatingItemId ?? selectedItemId;
    const menuItem = menuItems.find((item) => item.id === itemId);
    if (!menuItem) return;

    const variant = menuItem.variants.find((v) => v.id === variantId);
    if (!variant) return;

    const existing = cart.find(
      (i) => i.menuItemVariant?.id === variantId && i.status === "PENDING"
    );

    if (existing) {
      setCart(
        cart.map((i) =>
          i.menuItemVariant?.id === variantId && i.status === "PENDING"
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      const newItem: OrderItem = {
        id: `${Date.now()}-${menuItem.id}-${variant.id}`,
        menuItemVariant: {
          id: variant.id,
          name: variant.name,
          price: Number(variant.price),
          menuItem: {
            id: menuItem.id,
            name: menuItem.name,
            description: menuItem.description || undefined,
            category:
              categories.find((c) => c.id === menuItem.categoryId)?.name ||
              "Unknown",
            available: menuItem.isAvailable,
          },
        },
        quantity: 1,
        status: "PENDING",
        paymentStatus: "UNPAID",
        note: "",
        price: Number(variant.price),
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: "Added to order",
      description: `${getLocalizedName(
        menuItem,
        language
      )} - ${getLocalizedName(variant as any, language)}`,
      duration: 1000,
    });

    setVariantDialogOpen(false);
    setSelectedItemId(null);
  };

  const handleNoteEdit = (
    itemId: string,
    initialNote: string | undefined,
    itemName: string
  ) => {
    setEditingNote({ itemId, initialNote, itemName });
  };

  const handleNoteSave = (note: string) => {
    if (!editingNote) return;
    setCart(
      cart.map((item) =>
        item.id === editingNote.itemId ? { ...item, note } : item
      )
    );
    setEditingNote(null);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.id !== itemId));
    } else {
      setCart(
        cart.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleUpdateItemStatus = async (
    itemId: string,
    status: "SERVED" | "CANCELLED"
  ) => {
    try {
      await apiService.updateOrderItemStatus(itemId, status);
      toast({
        title: "Success",
        description: `Item marked as ${status.toLowerCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };

  const handleServeAll = async () => {
    const preparedItems = cart.filter((item) => item.status === "PREPARED");

    if (preparedItems.length === 0) return;

    try {
      // Call the API for each prepared item
      await Promise.all(
        preparedItems.map((item) =>
          apiService.updateOrderItemStatus(item.id, "SERVED")
        )
      );

      toast({
        title: "Success",
        description: `${preparedItems.length} item(s) marked as served`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to serve all items",
        variant: "destructive",
      });
    }
  };

  const handleCompleteOrder = async () => {
    if (!currentOrder) return;
    try {
      await apiService.completeOrder(currentOrder.id);
      toast({
        title: "Success",
        description: "Order marked as completed",
      });
      navigate("/tables");
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description: apiError.message || "Failed to complete order",
        variant: "destructive",
      });
    }
  };

  const canShowCancel = (status: OrderItemStatus) => {
    // Manager can cancel at any stage except already cancelled
    if (user?.role === "manager") return status !== "CANCELLED";
    // Others (e.g., waiter) can cancel only when ORDERED
    return status === "ORDERED";
  };

  const processOrder = async () => {
    const newItems = cart
      .filter((item) => item.status === "PENDING")
      .map((item) => ({
        menuItemVariantId: item.menuItemVariant?.id,
        quantity: item.quantity,
        note: (item as any).note,
      }));

    if (newItems.length === 0) {
      toast({
        title: "Info",
        description: "No new items to add",
      });
      return;
    }

    if (!incomingOrderId && !incomingTableId) {
      toast({
        title: "Error",
        description: "No table or order selected",
        variant: "destructive",
      });
      return;
    }

    try {
      let response;
      if (incomingOrderId) {
        response = await executeOrder(() =>
          apiService.addItemsToOrder(incomingOrderId, newItems)
        );
      } else if (incomingTableId) {
        response = await executeOrder(() =>
          apiService.createOrder({
            tableId: incomingTableId,
            items: newItems,
          })
        );
      }

      if (response) {
        setCart(
          mapOrderItemsToCart(response.data.orderItems, categories, menuItems)
        );
        navigate("/waiter-order", {
          state: { orderId: response.data.id, tableId: response.data.tableId },
        });
      }

      toast({
        title: "Success",
        description: "Order sent to kitchen",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process order",
        variant: "destructive",
      });
    }
  };

  const getBadgeVariant = (status: OrderItemStatus) => {
    switch (status) {
      case "PENDING":
        return "outline";
      case "ORDERED":
        return "secondary";
      case "PREPARING":
        return "warning";
      case "PREPARED":
        return "success";
      case "SERVED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const currentItems = menuItems.filter((item) => {
    if (item.categoryId !== activeCategory) return false;
    const localized = getLocalizedName(item as any, language).toLowerCase();
    return localized.includes(searchTerm.toLowerCase());
  });

  const getItemQuantityInCart = (menuItemId: string): number => {
    return cart
      .filter(
        (cartItem) => cartItem.menuItemVariant?.menuItem.id === menuItemId
      )
      .reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  const canCompleteOrder =
    currentOrder &&
    currentOrder.orderItems &&
    currentOrder.orderItems.every(
      (item) => item.status === "SERVED" || item.status === "CANCELLED"
    );

  const orderSummary = useMemo(() => {
    const pending = cart.filter((item) => item.status === "PENDING").length;
    const preparing = cart.filter(
      (item) => item.status === "ORDERED" || item.status === "PREPARING"
    ).length;
    const ready = cart.filter((item) => item.status === "PREPARED").length;
    const served = cart.filter((item) => item.status === "SERVED").length;

    return { pending, preparing, ready, served };
  }, [cart]);

  // Prefer API-provided order total; fall back to local cart sum for new/unsent items
  const displayTotalAmount = useMemo(() => {
    if (
      currentOrder &&
      typeof (currentOrder as any).totalAmount !== "undefined"
    ) {
      return Number((currentOrder as any).totalAmount) || 0;
    }
    // Fallback: local sum (useful for brand new orders before API responds)
    return cart.reduce(
      (sum, item) =>
        sum +
        (Number(item.price ?? item.menuItemVariant?.price ?? 0) || 0) *
          item.quantity,
      0
    );
  }, [currentOrder, cart]);

  return (
    <div className="flex h-[90vh] bg-background">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {/* Header */}
        <div className="bg-card border-b p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/tables")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  {currentOrder
                    ? currentOrder.orderType === "DELIVERY_ZOMATO" ||
                      currentOrder.orderType === "DELIVERY_SWIGGY" ||
                      currentOrder.orderType === "DELIVERY_OTHER"
                      ? "Delivery Order"
                      : `Table ${currentOrder.table?.tableNumber || "N/A"}`
                    : "New Order"}
                  {currentOrder?.orderType === "DELIVERY_ZOMATO" && (
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <Bike className="h-3 w-3" />
                      Zomato
                    </Badge>
                  )}
                  {currentOrder?.orderType === "DELIVERY_SWIGGY" && (
                    <Badge
                      variant="default"
                      className="flex items-center gap-1 bg-orange-500"
                    >
                      <Bike className="h-3 w-3" />
                      Swiggy
                    </Badge>
                  )}
                  {currentOrder?.orderType === "DELIVERY_OTHER" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Bike className="h-3 w-3" />
                      Delivery
                    </Badge>
                  )}
                </h1>
                {currentOrder && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Order #{currentOrder.id.slice(0, 8)}
                    </p>
                    {currentOrder.customerName && (
                      <p className="text-sm text-muted-foreground">
                        Customer: {currentOrder.customerName}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="hidden md:flex"
              onClick={() => navigate("/tables")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tables
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1" />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-card border-b p-4 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                className="whitespace-nowrap"
                size="sm"
              >
                {getLocalizedName(category, language)}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {currentItems.map((item) => {
              const quantityInCart = getItemQuantityInCart(item.id);
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-lg relative ${
                    !item.isAvailable ? "opacity-50" : ""
                  }`}
                  onClick={() => item.isAvailable && addToCart(item)}
                >
                  {quantityInCart > 0 && (
                    <Badge
                      variant="default"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0 text-xs font-bold z-10"
                    >
                      {quantityInCart}
                    </Badge>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                      {getLocalizedName(item, language)}
                    </h3>
                    <p className="text-lg font-bold text-primary">
                      {item.variants.length === 1
                        ? `₹${parseFloat(item.variants[0].price).toFixed(2)}`
                        : `From ₹${Math.min(
                            ...item.variants.map((v) => parseFloat(v.price))
                          ).toFixed(2)}`}
                    </p>
                    {!item.isAvailable && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Unavailable
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Mobile FAB */}
        <Button
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
          size="icon"
          onClick={() => setIsOrderPanelOpen(!isOrderPanelOpen)}
        >
          <Receipt className="h-6 w-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
        </Button>
      </div>

      {/* Order Summary Section - Desktop */}
      <div className="hidden md:flex w-80 lg:w-96 bg-card border-l flex-col shrink-0">
        {/* <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Current Order</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {currentOrder && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="font-bold text-secondary">
                  {orderSummary.pending}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Preparing</div>
                <div className="font-bold text-warning">
                  {orderSummary.preparing}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ready</div>
                <div className="font-bold text-success">
                  {orderSummary.ready}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Served</div>
                <div className="font-bold">{orderSummary.served}</div>
              </div>
            </div>
          )}
        </div> */}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items in order</p>
            </div>
          ) : (
            cart.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {getLocalizedName(
                          item.menuItemVariant?.menuItem,
                          language
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        ₹
                        {(
                          item.price ??
                          item.menuItemVariant?.price ??
                          0
                        ).toFixed(2)}{" "}
                        each
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getLocalizedName(
                          item.menuItemVariant as any,
                          language
                        )}
                      </p>
                      {item.note && (
                        <p className="text-xs text-muted-foreground">
                          Note: {item.note}
                        </p>
                      )}
                      <Badge
                        variant={getBadgeVariant(item.status)}
                        className="mt-1 text-xs"
                      >
                        {item.status === "ORDERED" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {item.status === "PREPARING" && (
                          <ChefHat className="h-3 w-3 mr-1" />
                        )}
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 mr-1"
                        onClick={() =>
                          handleNoteEdit(
                            item.id,
                            (item as any).note,
                            item.menuItemVariant?.menuItem.name || "Item"
                          )
                        }
                        title="Add/Edit Note"
                        disabled={item.status !== "PENDING"}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.status !== "PENDING"}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={item.status !== "PENDING"}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={!canShowCancel(item.status)}
                            className="text-destructive"
                            onClick={() => setCancelTarget(item)}
                          >
                            <XCircle className="h-3 w-3 mr-2" /> Cancel item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {item.status === "PREPARED" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                        onClick={() =>
                          handleUpdateItemStatus(item.id, "SERVED")
                        }
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Serve
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t space-y-3 bg-muted/20">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">
              ₹{displayTotalAmount.toFixed(2)}
            </span>
          </div>

          <Separator />

          <Button
            size="lg"
            className="w-full"
            onClick={processOrder}
            disabled={
              cart.filter((item) => item.status === "PENDING").length === 0 ||
              orderLoading
            }
          >
            <Save className="mr-2 h-5 w-5" />
            {orderLoading ? "Processing..." : "Send to Kitchen"}
          </Button>

          {cart.filter((item) => item.status === "PREPARED").length > 0 && (
            <Button
              size="lg"
              className="w-full"
              variant="default"
              onClick={handleServeAll}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Serve All Ready Items
            </Button>
          )}

          {currentOrder && (
            <Button
              size="lg"
              className="w-full"
              variant="outline"
              onClick={handleCompleteOrder}
              disabled={!canCompleteOrder}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Complete Order
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Order Summary Sheet */}
      {isOrderPanelOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOrderPanelOpen(false)}
        >
          <div
            className="absolute right-0 top-16 bottom-0 w-full max-w-sm bg-card border-l flex flex-col shadow-2xl animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Panel Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Current Order</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOrderPanelOpen(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items in order</p>
                </div>
              ) : (
                cart.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {getLocalizedName(
                              item.menuItemVariant?.menuItem,
                              language
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            ₹
                            {(
                              item.price ??
                              item.menuItemVariant?.price ??
                              0
                            ).toFixed(2)}{" "}
                            each
                          </p>
                          {item.note && (
                            <p className="text-xs text-muted-foreground">
                              Note: {item.note}
                            </p>
                          )}
                          <Badge
                            variant={getBadgeVariant(item.status)}
                            className="mt-1 text-xs"
                          >
                            {item.status === "ORDERED" && (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {item.status === "PREPARING" && (
                              <ChefHat className="h-3 w-3 mr-1" />
                            )}
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 mr-1"
                            onClick={() =>
                              handleNoteEdit(
                                item.id,
                                (item as any).note,
                                item.menuItemVariant?.menuItem.name || "Item"
                              )
                            }
                            title="Add/Edit Note"
                            disabled={item.status !== "PENDING"}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.status !== "PENDING"}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={item.status !== "PENDING"}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={!canShowCancel(item.status)}
                                className="text-destructive"
                                onClick={() => setCancelTarget(item)}
                              >
                                <XCircle className="h-3 w-3 mr-2" /> Cancel item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {item.status === "PREPARED" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                            onClick={() =>
                              handleUpdateItemStatus(item.id, "SERVED")
                            }
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Serve
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t space-y-3 bg-muted/20">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  ₹{displayTotalAmount.toFixed(2)}
                </span>
              </div>

              <Separator />

              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  processOrder();
                  setIsOrderPanelOpen(false);
                }}
                disabled={
                  cart.filter((item) => item.status === "PENDING").length ===
                    0 || orderLoading
                }
              >
                <Save className="mr-2 h-5 w-5" />
                {orderLoading ? "Processing..." : "Send to Kitchen"}
              </Button>

              {cart.filter((item) => item.status === "PREPARED").length > 0 && (
                <Button
                  size="lg"
                  className="w-full"
                  variant="default"
                  onClick={() => {
                    handleServeAll();
                    setIsOrderPanelOpen(false);
                  }}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Serve All Ready Items
                </Button>
              )}

              {currentOrder && (
                <Button
                  size="lg"
                  className="w-full"
                  variant="outline"
                  onClick={handleCompleteOrder}
                  disabled={!canCompleteOrder}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Complete Order
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Dialogs */}
      <VariantSelectionDialog
        item={menuItems.find((item) => item.id === selectedItemId)}
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        onSelect={(variantId: string) => handleVariantSelect(variantId)}
      />

      <EditNoteDialog
        open={!!editingNote}
        onOpenChange={(isOpen) => !isOpen && setEditingNote(null)}
        initialNote={editingNote?.initialNote}
        onSave={handleNoteSave}
        itemName={editingNote?.itemName || ""}
      />

      {/* Confirm Cancel Dialog */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will cancel the selected order item. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (cancelTarget) {
                  await handleUpdateItemStatus(cancelTarget.id, "CANCELLED");
                  setCancelTarget(null);
                }
              }}
            >
              Yes, cancel item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WaiterOrderManagement;
