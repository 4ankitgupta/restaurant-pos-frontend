// REFACTORED POSTerminal - Now using smaller, reusable components
// This is a simplified version showing how to use the new components
// Copy this to replace POSTerminal.tsx after reviewing

import { useEffect, useState, useRef } from "react";
import { APIMenuItem, APITable, APIOrder } from "@/types/restaurant";
import { useApi } from "@/hooks/useApi";
import { apiService } from "@/services/apiService";
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
import { toast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";
import { useRefresh } from "@/contexts/RefreshContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

// Import new modular components
import {
  POSHeader,
  FloorPlan,
  MenuGrid,
  CartSidebar,
  MobileCartDrawer,
  MobileCartFooter,
} from "./pos";

// Import existing dialogs
import { VariantSelectionDialog } from "./VariantSelectionDialog";
import { EditNoteDialog } from "./EditNoteDialog";
import { PaymentDialog } from "./PaymentDialog";
import { BillReceipt } from "./BillReceipt";
import { KOTReceipt } from "./KOTReceipt";
import { OrderList } from "./OrderList";
import "./KOTReceipt.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, RefreshCw } from "lucide-react";

// Types
interface MenuCategory {
  id: string;
  name: string;
  nameHindi?: string;
}

type ServiceType = "DINE_IN" | "TAKEAWAY";

interface CartItem {
  key: string;
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
  const isMobile = useIsMobile();
  const { refreshKey } = useRefresh();
  const { orders: wsOrders, lastTableUpdate } = useWebSocket();
  const { user } = useAuth();

  // State
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<APITable[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>("DINE_IN");
  const [selectedTable, setSelectedTable] = useState<APITable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<APIOrder | null>(null);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  // Dialog states
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<{
    cartKey: string;
    initialNote?: string;
    itemName: string;
  } | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<APIOrder | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] =
    useState<APIOrder | null>(null);
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [activeTakeawayOpen, setActiveTakeawayOpen] = useState(false);
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);

  // Print refs
  const billRef = useRef<HTMLDivElement>(null);
  const kotRef = useRef<HTMLDivElement>(null);
  const historyBillRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Bill-${currentOrder?.id.substring(0, 8) || "order"}`,
  });

  const handlePrintKOT = useReactToPrint({
    contentRef: kotRef,
    documentTitle: `KOT-${currentOrder?.id.substring(0, 8) || "order"}`,
  });

  const handlePrintHistoryBill = useReactToPrint({
    contentRef: historyBillRef,
    documentTitle: `Bill-${
      selectedHistoryOrder?.id.substring(0, 8) || "order"
    }`,
  });

  // Filter active takeaway orders
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

  // Fetch data
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

  // WebSocket sync
  useEffect(() => {
    if (currentOrder && wsOrders && wsOrders.length > 0) {
      const updated = wsOrders.find((o) => o.id === currentOrder.id);
      if (updated) {
        setCurrentOrder(updated);
      }
    }
  }, [wsOrders, currentOrder]);

  useEffect(() => {
    if (lastTableUpdate) {
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === lastTableUpdate.id
            ? { ...table, status: lastTableUpdate.status }
            : table
        )
      );

      if (selectedTable?.id === lastTableUpdate.id) {
        setSelectedTable((prev) =>
          prev ? { ...prev, status: lastTableUpdate.status } : null
        );
      }
    }
  }, [lastTableUpdate, selectedTable]);

  const refreshTables = () => {
    if (serviceType !== "DINE_IN") return;
    execTables(() => apiService.getTables())
      .then((res) => {
        if (res?.data) setTables(res.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (serviceType === "DINE_IN") {
      refreshTables();
    }
  }, [serviceType, refreshKey]);

  // Calculations
  const cartTotal = Array.from(cart.values()).reduce((acc, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    const variant = menuItem?.variants.find((v) => v.id === item.variantId);
    return acc + parseFloat(variant?.price || "0") * item.quantity;
  }, 0);

  const orderTotal = currentOrder
    ? parseFloat(String(currentOrder.totalAmount))
    : 0;
  const grandTotal = orderTotal + cartTotal;

  const hasOrderedItems =
    currentOrder?.orderItems?.some(
      (item) => item.status === "ORDERED" || item.status === "PENDING"
    ) || false;

  // Handlers
  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type);
    setSelectedTable(null);
    setCurrentOrder(null);
    setCart(new Map());
  };

  const handleTableClick = async (table: APITable) => {
    setSelectedTable(table);
    if (table.status === "Occupied") {
      try {
        const res = await execActiveOrder(() =>
          apiService.getActiveOrderForTable(table.id)
        );
        if (res && "data" in res) {
          setCurrentOrder((res as any).data || null);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setCurrentOrder(null);
    }
  };

  const handleBackToFloorPlan = () => {
    setSelectedTable(null);
    setCurrentOrder(null);
    setCart(new Map());
  };

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

  const handleEditNote = (
    cartKey: string,
    note?: string,
    itemName?: string
  ) => {
    setEditingNote({
      cartKey,
      initialNote: note,
      itemName: itemName || "",
    });
  };

  const handleSaveNote = (note: string) => {
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
  };

  const toOrderItemsPayload = () =>
    Array.from(cart.values()).map((i) => ({
      menuItemVariantId: i.variantId,
      quantity: i.quantity,
      note: i.note,
    }));

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
          const res = await execAddItems(() =>
            apiService.addItemsToCashierOrder(order!.id, items)
          );
          order = res.data;
        } else {
          const res = await execKOT(() =>
            apiService.createTakeawayOrder(items)
          );
          order = (res as any)?.data ?? (res as any);
        }
      } else {
        if (!selectedTable) {
          toast({
            title: "Select a table",
            description: "Pick a table to continue.",
            variant: "destructive",
          });
          return;
        }
        if (order) {
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

      const updatedOrder = await apiService.getOrderDetails(paymentOrder.id);
      setPaymentOrder(updatedOrder.data);

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

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-110px)]">
      {/* Header */}
      <POSHeader
        serviceType={serviceType}
        onServiceTypeChange={handleServiceTypeChange}
        selectedTable={selectedTable}
        currentOrder={currentOrder}
        completedOrders={completedOrders}
        activeTakeawayOrders={activeTakeawayOrders}
        historyOpen={historyOpen}
        setHistoryOpen={setHistoryOpen}
        activeTakeawayOpen={activeTakeawayOpen}
        setActiveTakeawayOpen={setActiveTakeawayOpen}
        onSelectHistoryOrder={(order) => {
          setSelectedHistoryOrder(order);
          setHistoryOpen(false);
          setHistoryDetailOpen(true);
        }}
        onSelectActiveTakeaway={(order) => {
          setCurrentOrder(order);
          setCart(new Map());
          setActiveTakeawayOpen(false);
        }}
        selectedHistoryOrderId={selectedHistoryOrder?.id}
      />

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
            <FloorPlan
              tables={tables}
              onTableClick={handleTableClick}
              onRefresh={refreshTables}
            />
          ) : (
            <MenuGrid
              menuItems={menuItems}
              categories={categories}
              onItemClick={handleItemClick}
              showBackButton={serviceType === "DINE_IN" && !!selectedTable}
              onBackClick={handleBackToFloorPlan}
            />
          )}
        </div>

        {/* Right cart - Desktop sidebar */}
        {!isMobile && (
          <CartSidebar
            currentOrder={currentOrder}
            cart={cart}
            menuItems={menuItems}
            grandTotal={grandTotal}
            hasOrderedItems={hasOrderedItems}
            kotLoading={kotLoading}
            addItemsLoading={addItemsLoading}
            onSendToKitchen={sendToKitchen}
            onSettleAndPrint={settleAndPrint}
            onPrintBill={handlePrint}
            onPrintKOT={handlePrintKOT}
            onQuantityChange={handleQuantityChange}
            onEditNote={handleEditNote}
          />
        )}
      </div>

      {/* Mobile: Sticky Bottom Cart Footer + Drawer */}
      {isMobile && (serviceType === "TAKEAWAY" || selectedTable) && (
        <>
          <MobileCartFooter
            currentOrder={currentOrder}
            cartSize={cart.size}
            grandTotal={grandTotal}
            onViewCart={() => setCartDrawerOpen(true)}
          />

          <MobileCartDrawer
            open={cartDrawerOpen}
            onOpenChange={setCartDrawerOpen}
            currentOrder={currentOrder}
            cart={cart}
            menuItems={menuItems}
            grandTotal={grandTotal}
            hasOrderedItems={hasOrderedItems}
            kotLoading={kotLoading}
            addItemsLoading={addItemsLoading}
            onSendToKitchen={sendToKitchen}
            onSettleAndPrint={settleAndPrint}
            onPrintBill={handlePrint}
            onPrintKOT={handlePrintKOT}
            onQuantityChange={handleQuantityChange}
            onEditNote={handleEditNote}
          />
        </>
      )}

      {/* Dialogs */}
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
        onSave={handleSaveNote}
        itemName={editingNote?.itemName || ""}
      />

      {paymentOrder && (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={(open) => {
            setPaymentOpen(open);
            if (!open) {
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
                            {item.menuItemVariant.menuItem.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.menuItemVariant.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ₹
                            {(
                              parseFloat(String(item.price)) * item.quantity
                            ).toFixed(2)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

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

      {/* Hidden print containers */}
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

      {selectedHistoryOrder && (
        <div className="hidden">
          <BillReceipt ref={historyBillRef} order={selectedHistoryOrder} />
        </div>
      )}
    </div>
  );
};

export default POSTerminal;
