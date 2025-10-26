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
} from "lucide-react";
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
}


const mapOrderItemsToCart = (
  orderItems: APIOrder["orderItems"],
  categories: MenuCategory[],
  menuItems: APIMenuItem[]
): OrderItem[] => {
  return orderItems
    .map((item) => {
      const source =
        item.menuItem ?? menuItems.find((mi) => mi.id === item.menuItemId);

      if (!source) {
        return null;
      }

      const categoryName =
        categories.find((category) => category.id === source.categoryId)
          ?.name || "Unknown";
      return {
        id: item.id,
        menuItem: {
          id: source.id,
          name: source.name,
          price: Number(source.price),
          category: categoryName,
          description: source.description ?? undefined,
          available: source.isAvailable,
        },
        quantity: item.quantity,
        status: item.status,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

const WaiterOrderManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useWebSocket();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

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

  const addToCart = (apiMenuItem: APIMenuItem) => {
    const menuItem: MenuItem = {
      id: apiMenuItem.id,
      name: apiMenuItem.name,
      price: Number(apiMenuItem.price),
      category:
        categories.find((c) => c.id === apiMenuItem.categoryId)?.name ||
        "Unknown",
      description: apiMenuItem.description || undefined,
      available: apiMenuItem.isAvailable,
    };

    const existingItem = cart.find(
      (item) => item.menuItem.id === menuItem.id && item.status === "PENDING"
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuItem.id === menuItem.id && item.status === "PENDING"
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newOrderItem: OrderItem = {
        id: `${Date.now()}-${menuItem.id}`,
        menuItem,
        quantity: 1,
        status: "PENDING",
      };
      setCart([...cart, newOrderItem]);
    }
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

  const processOrder = async () => {
    const newItems = cart
      .filter((item) => item.status === "PENDING")
      .map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
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
          mapOrderItemsToCart(
            response.data.orderItems,
            categories,
            menuItems
          )
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

  const currentItems = menuItems.filter(
    (item) =>
      item.categoryId === activeCategory &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCompleteOrder =
    currentOrder &&
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

  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
  }, [cart]);

  return (
    <div className="flex h-screen bg-background">
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
                <h1 className="text-xl md:text-2xl font-bold">
                  {currentOrder
                    ? `Table ${currentOrder.table?.tableNumber || "N/A"}`
                    : "New Order"}
                </h1>
                {currentOrder && (
                  <p className="text-sm text-muted-foreground">
                    Order #{currentOrder.id.slice(0, 8)}
                  </p>
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {currentItems.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  !item.isAvailable ? "opacity-50" : ""
                }`}
                onClick={() => item.isAvailable && addToCart(item)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-lg font-bold text-primary">
                    ₹{Number(item.price).toFixed(2)}
                  </p>
                  {!item.isAvailable && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Unavailable
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
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
        {/* Order Header */}
        <div className="p-4 border-b space-y-3">
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

          {/* Order Status Summary */}
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
                        {item.menuItem.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        ₹{item.menuItem.price.toFixed(2)} each
                      </p>
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
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() =>
                          handleUpdateItemStatus(item.id, "CANCELLED")
                        }
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancel
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
            <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
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
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l flex flex-col shadow-2xl animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Order Header */}
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Current Order</h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCart([])}
                    disabled={cart.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOrderPanelOpen(false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Order Status Summary */}
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
                            {item.menuItem.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            ₹{item.menuItem.price.toFixed(2)} each
                          </p>
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
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() =>
                              handleUpdateItemStatus(item.id, "CANCELLED")
                            }
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
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
                <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
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
                  cart.filter((item) => item.status === "PENDING").length === 0 ||
                  orderLoading
                }
              >
                <Save className="mr-2 h-5 w-5" />
                {orderLoading ? "Processing..." : "Send to Kitchen"}
              </Button>

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
    </div>
  );
};

export default WaiterOrderManagement;
