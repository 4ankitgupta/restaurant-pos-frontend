import { useEffect, useMemo, useState } from "react";
import { APIMenuItem, APITable, APIOrder } from "@/types/restaurant";
import { useApi } from "@/hooks/useApi";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantSelectionDialog } from "./VariantSelectionDialog";
import { EditNoteDialog } from "./EditNoteDialog";
import { toast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  LayoutGrid,
  Utensils,
  Send,
  Printer,
  ArrowLeft,
  RotateCw,
  ChefHat,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { PaymentDialog } from "./PaymentDialog";
import { useRefresh } from "@/contexts/RefreshContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedName } from "@/lib/utils";

// Local types
interface MenuCategory {
  id: string;
  name: string;
  nameHindi?: string;
}

type ServiceType = "DINE_IN" | "TAKEAWAY";

interface CartItem {
  key: string; // menuItemId-variantId
  menuItemId: string;
  variantId: string;
  quantity: number;
  note?: string;
}

export const POSTerminal: React.FC = () => {
  // Data
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<APITable[]>([]);

  // Real-time sync context
  const { refreshKey } = useRefresh();
  // --- FIXED: Destructure lastTableUpdate correctly from context ---
  const { orders: wsOrders, lastTableUpdate } = useWebSocket();
  const { language } = useLanguage();

  // Mode and context
  const [serviceType, setServiceType] = useState<ServiceType>("DINE_IN");
  const [selectedTable, setSelectedTable] = useState<APITable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<APIOrder | null>(null);

  // Menu filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Cart state
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  // Variant chooser and notes
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    cartKey: string;
    initialNote?: string;
    itemName: string;
  } | null>(null);

  // Payment dialog state for Express (Settle & Print)
  const [paymentOrder, setPaymentOrder] = useState<APIOrder | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // APIs
  const { execute: execMenu } = useApi<{ data: APIMenuItem[] }>();
  const { execute: execCats } = useApi<{ data: MenuCategory[] }>();
  const { execute: execTables } = useApi<{ data: APITable[] }>();
  const { execute: execActiveOrder } = useApi<{ data: APIOrder | null }>();
  const { loading: kotLoading, execute: execKOT } = useApi<any>();
  const { loading: payLoading, execute: execPay } = useApi();
  const { loading: addItemsLoading, execute: execAddItems } = useApi<{
    data: APIOrder;
  }>();

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [m, c] = await Promise.all([
          execMenu(() => apiService.getMenuItems()),
          execCats(() => apiService.getMenuCategories()),
        ]);
        if (m?.data) setMenuItems(m.data);
        else if (Array.isArray(m)) setMenuItems(m as unknown as APIMenuItem[]);
        if (c?.data) setCategories(c.data);
        else if (Array.isArray(c))
          setCategories(c as unknown as MenuCategory[]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAll();
  }, []);

  // --- WebSocket Sync Logic ---

  // 1. Keep currentOrder in sync with incoming WebSocket data
  useEffect(() => {
    if (currentOrder && wsOrders && wsOrders.length > 0) {
      const updated = wsOrders.find((o) => o.id === currentOrder.id);
      if (updated) {
        setCurrentOrder(updated);
      }
    }
  }, [wsOrders, currentOrder]);

  // 2. --- NEW: Handle Table Status Updates via WebSocket ---
  useEffect(() => {
    if (lastTableUpdate) {
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === lastTableUpdate.id
            ? { ...table, status: lastTableUpdate.status }
            : table
        )
      );

      // If the currently selected table was updated, update local selection too
      if (selectedTable?.id === lastTableUpdate.id) {
        setSelectedTable((prev) =>
          prev ? { ...prev, status: lastTableUpdate.status } : null
        );
      }
    }
  }, [lastTableUpdate, selectedTable]);

  // Fallback: fetch tables on mode switch or manual refresh
  const refreshTables = () => {
    if (serviceType !== "DINE_IN") return;
    execTables(() => apiService.getTables())
      .then((res) => {
        if (res?.data) setTables(res.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Initial load or full refresh signal
    if (serviceType === "DINE_IN") {
      refreshTables();
    }
  }, [serviceType, refreshKey]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Derived
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (activeCategory && item.categoryId !== activeCategory) return false;
      const localized = getLocalizedName(item as any, language).toLowerCase();
      return localized.includes(searchTerm.toLowerCase());
    });
  }, [menuItems, activeCategory, searchTerm, language]);

  // Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ORDERED":
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-200 bg-amber-50"
          >
            <Clock className="w-3 h-3 mr-1" /> Ordered
          </Badge>
        );
      case "PREPARING":
      case "IN_PROGRESS":
        return (
          <Badge variant="secondary" className="text-blue-600 bg-blue-50">
            <ChefHat className="w-3 h-3 mr-1" /> Preparing
          </Badge>
        );
      case "SERVED":
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Served
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate totals
  const cartTotal = Array.from(cart.values()).reduce((acc, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    const variant = menuItem?.variants.find((v) => v.id === item.variantId);
    return acc + parseFloat(variant?.price || "0") * item.quantity;
  }, 0);

  const orderTotal = currentOrder
    ? parseFloat(String(currentOrder.totalAmount))
    : 0;
  const grandTotal = orderTotal + cartTotal;

  // Helpers
  const getItemPriceRange = (item: APIMenuItem) => {
    const prices = item.variants.map((v) => parseFloat(v.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `₹${minPrice.toFixed(2)}`
      : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`;
  };

  const resetWorkArea = () => {
    setCart(new Map());
    setSelectedItemId(null);
    setVariantDialogOpen(false);
  };

  // Item selection flow
  const handleItemClick = (menuItem: APIMenuItem) => {
    if (!menuItem.variants || menuItem.variants.length === 0) {
      toast({
        title: "No variants configured",
        description: "Please add a variant before ordering this item.",
        variant: "destructive",
      });
      return;
    }
    if (menuItem.variants.length === 1) {
      handleVariantSelect(menuItem.id, menuItem.variants[0].id);
    } else {
      setSelectedItemId(menuItem.id);
      setVariantDialogOpen(true);
    }
  };

  const handleVariantSelect = (
    menuItemId: string,
    variantId: string,
    note?: string
  ) => {
    const cartKey = `${menuItemId}-${variantId}`;
    const newCart = new Map(cart);
    const current = newCart.get(cartKey);
    if (current) {
      newCart.set(cartKey, {
        ...current,
        quantity: current.quantity + 1,
        note: note ?? current.note,
      });
    } else {
      newCart.set(cartKey, {
        key: cartKey,
        menuItemId,
        variantId,
        quantity: 1,
        note,
      });
    }
    setCart(newCart);
    setSelectedItemId(null);
    setVariantDialogOpen(false);
  };

  const handleQuantityChange = (cartKey: string, op: "add" | "remove") => {
    const newCart = new Map(cart);
    const item = newCart.get(cartKey);
    if (!item) return;
    if (op === "add") {
      newCart.set(cartKey, { ...item, quantity: item.quantity + 1 });
    } else {
      if (item.quantity > 1)
        newCart.set(cartKey, { ...item, quantity: item.quantity - 1 });
      else newCart.delete(cartKey);
    }
    setCart(newCart);
  };

  const toOrderItemsPayload = () =>
    Array.from(cart.values()).map((i) => ({
      menuItemVariantId: i.variantId,
      quantity: i.quantity,
      note: i.note,
    }));

  // Table interactions
  const handleTableClick = async (table: APITable) => {
    setSelectedTable(table);
    // If occupied, load current order
    if (table.status === "Occupied") {
      try {
        const res = await execActiveOrder(() =>
          apiService.getActiveOrderForTable(table.id)
        );
        if (res && "data" in res) {
          // Some backends return {data: null} when no order
          setCurrentOrder((res as any).data || null);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setCurrentOrder(null);
    }
    // Flip to menu after selecting table
    setSearchTerm("");
  };

  // Actions
  const sendToKitchen = async () => {
    const items = toOrderItemsPayload();
    if (items.length === 0 && !currentOrder) {
      toast({
        title: "No items",
        description: "Add items to proceed.",
        variant: "destructive",
      });
      return;
    }

    try {
      let order: APIOrder | null = currentOrder;

      if (serviceType === "TAKEAWAY") {
        if (items.length === 0 && order) {
          toast({
            title: "Nothing to send",
            description: "Cart is empty.",
            variant: "destructive",
          });
          return;
        }
        const res = await execKOT(() => apiService.createTakeawayOrder(items));
        order = (res as any)?.data ?? (res as any);
      } else {
        // DINE_IN
        if (!selectedTable) {
          toast({
            title: "Select a table",
            description: "Pick a table to continue.",
            variant: "destructive",
          });
          return;
        }
        if (order) {
          // Add items to existing order
          if (items.length === 0) {
            toast({
              title: "Nothing to add",
              description: "Cart is empty.",
              variant: "destructive",
            });
            return;
          }
          const res = await execAddItems(() =>
            apiService.addItemsToCashierOrder(order!.id, items)
          );
          order = res.data;
        } else {
          // Create new table order
          const res = await execKOT(() =>
            apiService.createOrder({ tableId: selectedTable.id, items })
          );
          order = (res as any)?.data ?? (res as any);
        }
      }

      if (order) {
        setCurrentOrder(order);
        setCart(new Map());
        toast({ title: "Sent to Kitchen", description: "Order updated." });
        // Manually refresh tables immediately to show occupancy state change
        if (serviceType === "DINE_IN") {
          refreshTables();
        }
      }
    } catch (e: any) {
      const message = e?.message || "Failed to send to kitchen";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const settleAndPrint = async () => {
    try {
      let order: APIOrder | null = currentOrder;
      // If no order yet, create first from cart
      if (!order) {
        const items = toOrderItemsPayload();
        if (items.length === 0) {
          toast({
            title: "No items",
            description: "Add items to proceed.",
            variant: "destructive",
          });
          return;
        }
        if (serviceType === "TAKEAWAY") {
          const res = await execKOT(() =>
            apiService.createTakeawayOrder(items)
          );
          order = (res as any)?.data ?? (res as any);
        } else {
          if (!selectedTable) {
            toast({
              title: "Select a table",
              description: "Pick a table to continue.",
              variant: "destructive",
            });
            return;
          }
          const res = await execKOT(() =>
            apiService.createOrder({ tableId: selectedTable.id, items })
          );
          order = (res as any)?.data ?? (res as any);
        }
      } else if (cart.size > 0) {
        // If there are new items, add them before settling
        const items = toOrderItemsPayload();
        const res = await execAddItems(() =>
          apiService.addItemsToCashierOrder(order!.id, items)
        );
        order = res.data;
      }

      if (!order) return;
      setPaymentOrder(order);
      setPaymentOpen(true);
    } catch (e: any) {
      const message = e?.message || "Failed to create order";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleProcessPayment = async (paymentData: {
    method: "CASH" | "CARD" | "UPI" | "WALLET";
    amount: number;
    tenderedAmount?: number;
    orderItemIds?: string[];
  }) => {
    if (!paymentOrder) return;
    try {
      await execPay(() =>
        apiService.createPayment({
          orderId: paymentOrder.id,
          amount: paymentData.amount,
          paymentMethod: paymentData.method,
          tenderedAmount: paymentData.tenderedAmount,
          orderItemIds: paymentData.orderItemIds,
        })
      );

      const changeMessage = paymentData.tenderedAmount
        ? ` Change: ₹${(
            (paymentData.tenderedAmount || 0) - paymentData.amount
          ).toFixed(2)}`
        : "";

      toast({
        title: "Payment successful",
        description: `Order settled.${changeMessage}`,
      });

      setPaymentOpen(false);
      setPaymentOrder(null);
      setCart(new Map());
      // Refresh tables
      if (serviceType === "DINE_IN") {
        refreshTables();
      }
      setCurrentOrder(null);
      setSelectedTable(null);
    } catch (e: any) {
      const message = e?.message || "Payment failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-110px)]">
      {/* Header with mode */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Cashier Station</h1>
          <Badge variant="secondary" className="uppercase">
            POS Mode
          </Badge>
          {serviceType === "DINE_IN" && selectedTable && (
            <Badge>Table {selectedTable.tableNumber}</Badge>
          )}
          {currentOrder && (
            <Badge variant="outline">
              Order #{currentOrder.id.slice(0, 6)}
            </Badge>
          )}
        </div>

        <Tabs
          value={serviceType}
          onValueChange={(v) => {
            setServiceType(v as ServiceType);
            setSelectedTable(null);
            setCurrentOrder(null);
            setCart(new Map());
          }}
        >
          <TabsList>
            <TabsTrigger value="DINE_IN">
              <Utensils className="h-4 w-4 mr-1" /> Dine-In
            </TabsTrigger>
            <TabsTrigger value="TAKEAWAY">
              <LayoutGrid className="h-4 w-4 mr-1" /> Takeaway
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
        {/* Left workspace */}
        <div className="lg:col-span-2 border rounded-md p-3 flex flex-col min-h-0 bg-background">
          {serviceType === "DINE_IN" && !selectedTable ? (
            // Floor plan
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-muted-foreground">
                  Select Table
                </h3>
                <Button variant="ghost" size="sm" onClick={refreshTables}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
                  {tables.map((t) => (
                    <button
                      key={t.id}
                      className={`rounded-lg p-4 border text-left transition-all hover:scale-105 ${
                        t.status === "Occupied"
                          ? "bg-red-50 border-red-200 text-red-700 shadow-sm"
                          : t.status === "Available"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                          : "bg-muted/20"
                      }`}
                      onClick={() => handleTableClick(t)}
                    >
                      <div className="text-sm opacity-70">Table</div>
                      <div className="text-2xl font-bold">{t.tableNumber}</div>
                      <div className="mt-2 flex items-center gap-1">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            t.status === "Occupied"
                              ? "bg-red-500"
                              : "bg-emerald-500"
                          }`}
                        ></span>
                        <span className="text-xs font-medium">{t.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            // Menu grid
            <div className="flex flex-col gap-3 min-h-0 h-full">
              <div className="flex items-center gap-2">
                {serviceType === "DINE_IN" && selectedTable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTable(null);
                      setCurrentOrder(null);
                      setCart(new Map());
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Tables
                  </Button>
                )}
                <Input
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {getLocalizedName(cat as any, language)}
                  </Button>
                ))}
              </div>

              <ScrollArea className="flex-1 -mr-3 pr-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-4">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-colors"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-3">
                        <p className="font-medium line-clamp-2 min-h-[2.5rem] leading-tight">
                          {getLocalizedName(item as any, language)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                          {getItemPriceRange(item)}
                        </p>
                        {item.variants.length > 1 && (
                          <Badge
                            variant="secondary"
                            className="mt-2 text-[10px] h-5"
                          >
                            {item.variants.length} options
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Right cart */}
        <div className="border rounded-md p-3 flex flex-col min-h-0 bg-background">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Current Order</h3>
            <Badge variant="secondary">Total: ₹{grandTotal.toFixed(2)}</Badge>
          </div>
          <Separator className="my-3" />

          <ScrollArea className="flex-1 -mr-3 pr-3">
            <div className="space-y-4">
              {/* SECTION 1: EXISTING ITEMS (Already sent to kitchen) */}
              {currentOrder &&
                currentOrder.orderItems &&
                currentOrder.orderItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                      Kitchen / Served
                    </div>
                    {currentOrder.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col p-2 rounded-md bg-secondary/30 text-sm border border-transparent hover:border-border transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {item.quantity}x{" "}
                              {getLocalizedName(
                                item.menuItemVariant?.menuItem as any,
                                language
                              ) || "Unknown Item"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getLocalizedName(
                                item.menuItemVariant as any,
                                language
                              )}
                            </div>
                            {item.note && (
                              <div className="text-xs italic text-muted-foreground">
                                "{item.note}"
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-mono">
                              ₹{Number(item.price) * item.quantity}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Separator />
                  </div>
                )}

              {/* SECTION 2: NEW ITEMS (Local Cart) */}
              {cart.size > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider pl-1 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    New to Add
                  </div>
                  {Array.from(cart.values()).map((c) => {
                    const item = menuItems.find((mi) => mi.id === c.menuItemId);
                    const variant = item?.variants.find(
                      (v) => v.id === c.variantId
                    );
                    if (!item || !variant) return null;
                    return (
                      <div
                        key={c.key}
                        className="flex flex-col p-3 rounded-md bg-background border border-primary/20 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">
                              {getLocalizedName(item as any, language)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getLocalizedName(variant as any, language)}
                            </p>
                          </div>
                          <p className="font-medium text-sm">
                            ₹
                            {(parseFloat(variant.price) * c.quantity).toFixed(
                              2
                            )}
                          </p>
                        </div>

                        {c.note && (
                          <p className="text-xs text-amber-600 mt-1 italic bg-amber-50 p-1 rounded w-fit">
                            "{c.note}"
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() =>
                              setEditingNote({
                                cartKey: c.key,
                                initialNote: c.note,
                                itemName: item.name,
                              })
                            }
                          >
                            {c.note ? "Edit Note" : "+ Note"}
                          </Button>
                          <div className="flex items-center bg-secondary rounded-md">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-none"
                              onClick={() =>
                                handleQuantityChange(c.key, "remove")
                              }
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {c.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-none"
                              onClick={() => handleQuantityChange(c.key, "add")}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* EMPTY STATE */}
              {!currentOrder && cart.size === 0 && (
                <div className="text-center text-muted-foreground pt-12 flex flex-col items-center opacity-50">
                  <div className="bg-muted p-4 rounded-full mb-3">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                  <p>Cart is empty</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator className="my-3" />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={sendToKitchen}
              disabled={kotLoading}
              variant="outline"
              className="border-primary/20 hover:bg-primary/5 hover:text-primary"
            >
              <Send className="h-4 w-4 mr-2" />
              {kotLoading ? "Sending..." : "To Kitchen"}
            </Button>
            <Button
              onClick={settleAndPrint}
              disabled={kotLoading || addItemsLoading}
              className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
            >
              <Printer className="h-4 w-4 mr-2" />
              {kotLoading || addItemsLoading ? "..." : "Settle"}
            </Button>
          </div>
        </div>
      </div>

      {/* Variant & Note dialogs */}
      <VariantSelectionDialog
        item={menuItems.find((i) => i.id === selectedItemId)}
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        onSelect={(variantId) => {
          if (!selectedItemId) return;
          handleVariantSelect(selectedItemId, variantId);
        }}
      />

      <EditNoteDialog
        open={!!editingNote}
        onOpenChange={(isOpen) => !isOpen && setEditingNote(null)}
        initialNote={editingNote?.initialNote}
        onSave={(note) => {
          if (!editingNote) return;
          const newCart = new Map(cart);
          const item = newCart.get(editingNote.cartKey);
          if (item)
            newCart.set(editingNote.cartKey, {
              ...item,
              note: note || undefined,
            });
          setCart(newCart);
          setEditingNote(null);
        }}
        itemName={editingNote?.itemName || ""}
      />

      {/* Payment dialog */}
      {paymentOrder && (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          order={paymentOrder}
          onProcessPayment={handleProcessPayment}
          isLoading={payLoading}
        />
      )}
    </div>
  );
};

export default POSTerminal;
