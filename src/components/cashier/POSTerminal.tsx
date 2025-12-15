import { useEffect, useMemo, useState, useRef } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { VariantSelectionDialog } from "./VariantSelectionDialog";
import { EditNoteDialog } from "./EditNoteDialog";
import { BillReceipt } from "./BillReceipt";
import { KOTReceipt } from "./KOTReceipt";
import { OrderList } from "./OrderList";
import "./KOTReceipt.css";
import { toast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";
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
  History,
  Receipt,
  RefreshCw,
  Star,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { PaymentDialog } from "./PaymentDialog";
import { useRefresh } from "@/contexts/RefreshContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalizedName } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface POSTerminalProps {
  completedOrders?: APIOrder[];
  activeOrders?: APIOrder[];
}

export const POSTerminal: React.FC<POSTerminalProps> = ({
  completedOrders = [],
  activeOrders = [],
}) => {
  // Mobile detection
  const isMobile = useIsMobile();

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Data
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<APITable[]>([]);

  // Real-time sync context
  const { refreshKey } = useRefresh();
  // --- FIXED: Destructure lastTableUpdate correctly from context ---
  const { orders: wsOrders, lastTableUpdate } = useWebSocket();
  const { language } = useLanguage();
  const { user } = useAuth();

  // Mobile-specific: Cart drawer state
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Mode and context
  const [serviceType, setServiceType] = useState<ServiceType>("DINE_IN");
  const [selectedTable, setSelectedTable] = useState<APITable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<APIOrder | null>(null);

  // Menu filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Category show more/less state
  const [showAllCategories, setShowAllCategories] = useState(false);

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

  // History sheet state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] =
    useState<APIOrder | null>(null);
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);

  // Active takeaway orders sheet state
  const [activeTakeawayOpen, setActiveTakeawayOpen] = useState(false);
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);

  // Print bill ref
  const billRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Bill-${currentOrder?.id.substring(0, 8) || "order"}`,
  });

  // Print KOT ref
  const kotRef = useRef<HTMLDivElement>(null);
  const handlePrintKOT = useReactToPrint({
    contentRef: kotRef,
    documentTitle: `KOT-${currentOrder?.id.substring(0, 8) || "order"}`,
  });

  // Print history order bill ref
  const historyBillRef = useRef<HTMLDivElement>(null);
  const handlePrintHistoryBill = useReactToPrint({
    contentRef: historyBillRef,
    documentTitle: `Bill-${
      selectedHistoryOrder?.id.substring(0, 8) || "order"
    }`,
  });

  // Filter active takeaway orders (check both orderType and takeAway fields)
  const activeTakeawayOrders = activeOrders.filter(
    (order) => order.orderType === "TAKE_AWAY" || order.takeAway === true
  );

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
  const { loading: refundLoading, execute: execRefund } = useApi();

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
      setTables((prevTables) => {
        const updated = prevTables.map((table) =>
          table.id === lastTableUpdate.id
            ? { ...table, status: lastTableUpdate.status }
            : table
        );
        // Keep tables sorted by table number
        return updated.sort((a, b) => {
          const numA =
            typeof a.tableNumber === "number"
              ? a.tableNumber
              : parseInt(a.tableNumber, 10);
          const numB =
            typeof b.tableNumber === "number"
              ? b.tableNumber
              : parseInt(b.tableNumber, 10);
          return numA - numB;
        });
      });

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
        if (res?.data) {
          // Sort tables by table number
          const sortedTables = [...res.data].sort((a, b) => {
            const numA =
              typeof a.tableNumber === "number"
                ? a.tableNumber
                : parseInt(a.tableNumber, 10);
            const numB =
              typeof b.tableNumber === "number"
                ? b.tableNumber
                : parseInt(b.tableNumber, 10);
            return numA - numB;
          });
          setTables(sortedTables);
        }
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
    if (!activeCategory) {
      setActiveCategory("favorites");
    }
  }, [activeCategory]);

  // Derived
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Filter by favorites or category
      if (activeCategory === "favorites") {
        if (!item.isFavorite) return false;
      } else if (activeCategory && item.categoryId !== activeCategory) {
        return false;
      }

      // Filter by search term
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

  // Check if there are any ordered items for KOT
  const hasOrderedItems =
    currentOrder?.orderItems?.some(
      (item) => item.status === "ORDERED" || item.status === "PENDING"
    ) || false;

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

        if (order) {
          // Add items to existing takeaway order
          const res = await execAddItems(() =>
            apiService.addItemsToCashierOrder(order!.id, items)
          );
          order = res.data;
        } else {
          // Create new takeaway order
          const res = await execKOT(() =>
            apiService.createTakeawayOrder(items)
          );
          order = (res as any)?.data ?? (res as any);
        }
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

      // Fetch updated order with payment info
      const updatedOrder = await apiService.getOrderDetails(paymentOrder.id);
      setPaymentOrder(updatedOrder.data);

      // Don't close dialog here - let PaymentDialog handle success flow with WhatsApp sharing
      // The dialog will close itself after WhatsApp send or skip
      // Instead, just refresh the data
      setCart(new Map());
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

  const handleRefund = async () => {
    if (!selectedHistoryOrder) return;
    try {
      await execRefund(() => apiService.refundPayment(selectedHistoryOrder.id));
      toast({
        title: "Refund Processed",
        description: "The order has been refunded successfully.",
      });
      setRefundConfirmOpen(false);
      setHistoryDetailOpen(false);
      setSelectedHistoryOrder(null);
      // Optionally refresh completed orders
    } catch (e: any) {
      const message = e?.message || "Could not process refund";
      toast({
        title: "Refund Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isRefundable =
    selectedHistoryOrder?.status === "COMPLETED" &&
    selectedHistoryOrder?.paymentStatus === "PAID";

  const canRefund = user?.role === "manager" || user?.role === "admin";

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-110px)]">
      {/* Header with mode */}
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
          <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 md:p-2 rounded-lg">
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <span className="hidden sm:inline">Cashier Station</span>
            <span className="sm:hidden">POS</span>
          </h1>
          {serviceType === "DINE_IN" && selectedTable && (
            <Badge className="text-xs md:text-sm bg-blue-600">
              <Utensils className="h-3 w-3 mr-1" />
              Table {selectedTable.tableNumber}
            </Badge>
          )}
          {serviceType === "TAKEAWAY" && (
            <Badge className="text-xs md:text-sm bg-orange-600">
              <LayoutGrid className="h-3 w-3 mr-1" />
              Takeaway
            </Badge>
          )}
          {currentOrder && !isMobile && (
            <Badge variant="outline" className="text-xs md:text-sm">
              Order #{currentOrder.id.slice(0, 6)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "sm"}
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
            <span className="hidden md:inline ml-1">
              {isFullscreen ? "Exit" : "Fullscreen"}
            </span>
          </Button>
          {serviceType === "TAKEAWAY" && activeTakeawayOrders.length > 0 && (
            <Sheet
              open={activeTakeawayOpen}
              onOpenChange={setActiveTakeawayOpen}
            >
              <SheetTrigger asChild>
                <Button variant="default" size={isMobile ? "sm" : "sm"}>
                  <ShoppingCart className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">
                    Active ({activeTakeawayOrders.length})
                  </span>
                  <span className="md:hidden">
                    ({activeTakeawayOrders.length})
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Active Takeaway Orders</SheetTitle>
                  <SheetDescription>
                    View and manage active takeaway orders
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 h-[calc(100vh-200px)]">
                  <OrderList
                    orders={activeTakeawayOrders}
                    title="Active Takeaway Orders"
                    onSelectOrder={(order) => {
                      setCurrentOrder(order);
                      setCart(new Map());
                      setActiveTakeawayOpen(false);
                    }}
                    selectedOrderId={currentOrder?.id}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size={isMobile ? "sm" : "sm"}>
                <History className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">
                  History ({completedOrders.length})
                </span>
                <span className="md:hidden">({completedOrders.length})</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Completed Orders Today</SheetTitle>
                <SheetDescription>
                  View all completed orders from today
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 h-[calc(100vh-200px)]">
                <OrderList
                  orders={completedOrders}
                  title="Completed Orders"
                  onSelectOrder={(order) => {
                    setSelectedHistoryOrder(order);
                    setHistoryOpen(false);
                    setHistoryDetailOpen(true);
                  }}
                  selectedOrderId={selectedHistoryOrder?.id}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Tabs
            value={serviceType}
            onValueChange={(v) => {
              setServiceType(v as ServiceType);
              setSelectedTable(null);
              setCurrentOrder(null);
              setCart(new Map());
            }}
          >
            <TabsList className="h-9">
              <TabsTrigger value="DINE_IN" className="text-xs md:text-sm">
                <Utensils className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                <span className="hidden md:inline">Dine-In</span>
              </TabsTrigger>
              <TabsTrigger value="TAKEAWAY" className="text-xs md:text-sm">
                <LayoutGrid className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                <span className="hidden md:inline">Takeaway</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div
        className={`flex-1 min-h-0 ${
          isMobile ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-3 gap-3"
        }`}
      >
        {/* Left workspace - Menu/Table area */}
        <div
          className={`${
            isMobile
              ? "flex-1 flex flex-col min-h-0"
              : "lg:col-span-2 border rounded-md p-3 flex flex-col min-h-0 bg-background"
          }`}
        >
          {serviceType === "DINE_IN" && !selectedTable ? (
            // Floor plan
            <div className={`flex flex-col h-full ${isMobile ? "" : ""}`}>
              <div
                className={`flex justify-between items-center ${
                  isMobile ? "mb-3" : "mb-3"
                }`}
              >
                <div>
                  <h3 className="font-semibold text-lg md:text-xl flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    Select a Table
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    Choose an available table to start an order
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshTables}
                  title="Refresh Tables"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {tables.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="bg-muted/30 p-6 rounded-full mb-4">
                      <Utensils className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2">
                      No Tables Available
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Contact your administrator to set up tables for dine-in
                      service.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 p-1">
                    {tables.map((t) => (
                      <button
                        key={t.id}
                        className={`rounded-xl p-3 md:p-4 border-2 text-left transition-all active:scale-95 md:hover:scale-105 md:hover:shadow-lg ${
                          t.status === "Occupied"
                            ? "bg-red-50 border-red-300 text-red-700 shadow-md"
                            : t.status === "Available"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-md hover:bg-emerald-100"
                            : "bg-muted/20"
                        }`}
                        onClick={() => handleTableClick(t)}
                      >
                        <div className="text-xs md:text-sm opacity-70 font-medium">
                          Table
                        </div>
                        <div className="text-2xl md:text-3xl font-bold my-1">
                          {t.tableNumber}
                        </div>
                        <div className="mt-1 md:mt-2 flex items-center gap-1.5">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              t.status === "Occupied"
                                ? "bg-red-500 animate-pulse"
                                : "bg-emerald-500"
                            }`}
                          ></span>
                          <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">
                            {t.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            // Menu grid
            <div className="flex flex-col gap-2 md:gap-3 min-h-0 h-full">
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
                    className="shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">Back to Tables</span>
                  </Button>
                )}
                <div className="relative flex-1">
                  <Input
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 h-9 pl-9"
                  />
                  <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Sticky Category Navigation on Mobile */}
              <div
                className={`space-y-2 ${
                  isMobile
                    ? "sticky top-0 bg-background z-10 -mx-4 px-4 py-2 border-b"
                    : ""
                }`}
              >
                <div
                  className={`flex flex-wrap gap-2 transition-all duration-300 ${
                    !showAllCategories && categories.length > 6
                      ? "max-h-[68px] overflow-hidden"
                      : ""
                  }`}
                >
                  <Button
                    key="favorites"
                    variant={
                      activeCategory === "favorites" ? "default" : "outline"
                    }
                    size="sm"
                    className="whitespace-nowrap text-xs md:text-sm h-8 md:h-9"
                    onClick={() => setActiveCategory("favorites")}
                  >
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Favorites
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={
                        activeCategory === cat.id ? "default" : "outline"
                      }
                      size="sm"
                      className="whitespace-nowrap text-xs md:text-sm h-8 md:h-9"
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      {getLocalizedName(cat as any, language)}
                    </Button>
                  ))}
                </div>
                {categories.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="w-full h-7 text-xs"
                  >
                    {showAllCategories ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show More
                      </>
                    )}
                  </Button>
                )}
              </div>

              <ScrollArea
                className={`flex-1 ${isMobile ? "-mx-4 px-4" : "-mr-3 pr-3"}`}
              >
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="bg-muted/30 p-6 rounded-full mb-4">
                      <Utensils className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2">
                      {searchTerm ? "No items found" : "No menu items"}
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {searchTerm
                        ? `No items match "${searchTerm}". Try a different search term.`
                        : "Add menu items or select a different category."}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`grid gap-2 md:gap-3 ${
                      isMobile
                        ? "grid-cols-2 pb-24"
                        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 pb-4"
                    }`}
                  >
                    {filteredItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-colors active:scale-95 relative ${
                          item.isFavorite ? "border-2 border-yellow-400" : ""
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        {item.isFavorite && (
                          <Star className="absolute top-1 right-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <CardContent className={`${isMobile ? "p-2" : "p-3"}`}>
                          <p
                            className={`font-medium line-clamp-2 leading-tight ${
                              isMobile
                                ? "text-sm min-h-[2rem]"
                                : "min-h-[2.5rem]"
                            }`}
                          >
                            {getLocalizedName(item as any, language)}
                          </p>
                          <p
                            className={`text-muted-foreground mt-1 font-mono ${
                              isMobile ? "text-xs" : "text-sm"
                            }`}
                          >
                            {getItemPriceRange(item)}
                          </p>
                          {item.variants.length > 1 && (
                            <Badge
                              variant="secondary"
                              className="mt-1 md:mt-2 text-[9px] md:text-[10px] h-4 md:h-5"
                            >
                              {item.variants.length} options
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Right cart - Desktop sidebar / Mobile bottom drawer */}
        {!isMobile ? (
          // Desktop: Sidebar cart
          <div className="border rounded-md p-3 flex flex-col min-h-0 bg-background shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                  <Receipt className="h-4 w-4 text-primary" />
                </div>
                Current Order
              </h3>
              <Badge variant="secondary" className="text-sm font-semibold">
                ₹{grandTotal.toFixed(2)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {(currentOrder?.orderItems?.length || 0) + cart.size} items in
              order
            </p>
            <Separator className="my-2" />

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
                      const item = menuItems.find(
                        (mi) => mi.id === c.menuItemId
                      );
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
                                onClick={() =>
                                  handleQuantityChange(c.key, "add")
                                }
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
                  <div className="text-center text-muted-foreground pt-12 flex flex-col items-center">
                    <div className="bg-muted/30 p-6 rounded-full mb-4">
                      <ShoppingCart className="h-10 w-10" />
                    </div>
                    <h4 className="font-semibold text-base mb-2">
                      Cart is Empty
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {serviceType === "DINE_IN" && !selectedTable
                        ? "Select a table to begin"
                        : "Start adding items from the menu"}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator className="my-3" />

            {/* Actions */}
            <div className="space-y-2">
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
              {currentOrder && (
                <>
                  <Button
                    onClick={handlePrint}
                    variant="secondary"
                    className="w-full"
                    disabled={!currentOrder}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Print Bill
                  </Button>
                  <Button
                    onClick={handlePrintKOT}
                    variant="secondary"
                    className="w-full"
                    disabled={!hasOrderedItems}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print KOT
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile: Sticky Bottom Cart Footer + Drawer */}
      {isMobile && (serviceType === "TAKEAWAY" || selectedTable) && (
        <>
          {/* Sticky Footer Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 p-3 safe-area-bottom">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  Total Items
                </span>
                <span className="text-lg font-bold">
                  {(currentOrder?.orderItems?.length || 0) + cart.size}
                </span>
              </div>
              <div className="flex flex-col items-end flex-1">
                <span className="text-xs text-muted-foreground">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-primary">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
              <Button
                size="lg"
                onClick={() => setCartDrawerOpen(true)}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>View Cart</span>
              </Button>
            </div>
          </div>

          {/* Cart Drawer */}
          <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
            <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Current Order</SheetTitle>
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="secondary">
                    {(currentOrder?.orderItems?.length || 0) + cart.size} items
                  </Badge>
                  <span className="text-xl font-bold">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
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
                            className="flex flex-col p-3 rounded-md bg-secondary/30 text-sm border"
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
                                  <div className="text-xs italic text-muted-foreground mt-1">
                                    "{item.note}"
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-mono font-semibold">
                                  ₹
                                  {(Number(item.price) * item.quantity).toFixed(
                                    2
                                  )}
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
                        const item = menuItems.find(
                          (mi) => mi.id === c.menuItemId
                        );
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
                                {(
                                  parseFloat(variant.price) * c.quantity
                                ).toFixed(2)}
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
                                className="h-7 text-xs"
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
                                  className="h-8 w-8 rounded-none"
                                  onClick={() =>
                                    handleQuantityChange(c.key, "remove")
                                  }
                                >
                                  -
                                </Button>
                                <span className="w-10 text-center text-sm font-medium">
                                  {c.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-none"
                                  onClick={() =>
                                    handleQuantityChange(c.key, "add")
                                  }
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

              {/* Action Buttons at Bottom */}
              <div className="p-4 border-t bg-background space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      sendToKitchen();
                      setCartDrawerOpen(false);
                    }}
                    disabled={kotLoading}
                    variant="outline"
                    className="border-primary/20"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {kotLoading ? "Sending..." : "To Kitchen"}
                  </Button>
                  <Button
                    onClick={() => {
                      settleAndPrint();
                      setCartDrawerOpen(false);
                    }}
                    disabled={kotLoading || addItemsLoading}
                    className="bg-primary"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Settle
                  </Button>
                </div>
                {currentOrder && (
                  <>
                    <Button
                      onClick={() => {
                        handlePrint();
                        setCartDrawerOpen(false);
                      }}
                      variant="secondary"
                      className="w-full"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Print Bill
                    </Button>
                    <Button
                      onClick={() => {
                        handlePrintKOT();
                        setCartDrawerOpen(false);
                      }}
                      variant="secondary"
                      className="w-full"
                      disabled={!hasOrderedItems}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print KOT
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

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
          onOpenChange={(open) => {
            setPaymentOpen(open);
            if (!open) {
              // Clean up payment order when dialog closes
              setPaymentOrder(null);
            }
          }}
          order={paymentOrder}
          onProcessPayment={handleProcessPayment}
          isLoading={payLoading}
          onPrintBill={handlePrint}
        />
      )}

      {/* History Order Detail Dialog */}
      <Dialog open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Order Details #{selectedHistoryOrder?.id.substring(0, 8)}
            </DialogTitle>
            <DialogDescription>
              View order details and print bill
            </DialogDescription>
          </DialogHeader>

          {selectedHistoryOrder && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Table:</span>
                    <span className="ml-2 font-medium">
                      {selectedHistoryOrder.table?.tableNumber || "Takeaway"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2">
                      <Badge variant="default">
                        {selectedHistoryOrder.status}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order Type:</span>
                    <span className="ml-2 font-medium">
                      {selectedHistoryOrder.orderType}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="ml-2">
                      <Badge
                        variant={
                          selectedHistoryOrder.paymentStatus === "PAID"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedHistoryOrder.paymentStatus}
                      </Badge>
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">Items</h4>
                  <div className="space-y-2">
                    {selectedHistoryOrder.orderItems?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start p-2 bg-muted/30 rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
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
                            <div className="text-xs italic text-muted-foreground mt-1">
                              Note: {item.note}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ₹{(Number(item.price) * item.quantity).toFixed(2)}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Payment Info */}
                {selectedHistoryOrder.payments &&
                  selectedHistoryOrder.payments.length > 0 && (
                    <>
                      <div>
                        <h4 className="font-semibold mb-3">Payment Details</h4>
                        <div className="space-y-2">
                          {selectedHistoryOrder.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex justify-between items-center p-2 bg-muted/30 rounded"
                            >
                              <div>
                                <Badge variant="outline">
                                  {payment.paymentMethod}
                                </Badge>
                              </div>
                              <div className="font-medium">
                                ₹{Number(payment.amount).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span>
                    ₹{Number(selectedHistoryOrder.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handlePrintHistoryBill}
              variant="outline"
              className="flex-1"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Print Bill
            </Button>
            {canRefund && isRefundable && (
              <Button
                onClick={() => setRefundConfirmOpen(true)}
                variant="destructive"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refund
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={refundConfirmOpen} onOpenChange={setRefundConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this order? This action cannot be
              undone. Order Total: ₹
              {Number(selectedHistoryOrder?.totalAmount || 0).toFixed(2)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={refundLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {refundLoading ? "Processing..." : "Confirm Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden print containers for bill and KOT receipts */}
      {(currentOrder || paymentOrder) && (
        <>
          <div className="hidden">
            <BillReceipt ref={billRef} order={currentOrder || paymentOrder!} />
          </div>
          <div className="hidden">
            <KOTReceipt ref={kotRef} order={currentOrder || paymentOrder!} />
          </div>
        </>
      )}

      {/* Hidden print container for history order */}
      {selectedHistoryOrder && (
        <div className="hidden">
          <BillReceipt ref={historyBillRef} order={selectedHistoryOrder} />
        </div>
      )}
    </div>
  );
};

export default POSTerminal;
