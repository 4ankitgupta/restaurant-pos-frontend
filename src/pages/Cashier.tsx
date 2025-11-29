// src/pages/Cashier.tsx
import { useState, useEffect, useRef } from "react";
import { APIOrder, APIMenuItem } from "@/types/restaurant";
import { useApi } from "@/hooks/useApi";
import { apiService } from "@/services/apiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { OrderList } from "@/components/cashier/OrderList";
import { OrderDetail, OrderDetailRef } from "@/components/cashier/OrderDetail";
import { PaymentDialog } from "@/components/cashier/PaymentDialog";
import { AddItemsDialog } from "@/components/cashier/AddItemsDialog";
import { POSTerminal } from "@/components/cashier/POSTerminal";
import { TakeawayDialog } from "@/components/cashier/TakeawayDialog";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
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

import { useAuth } from "@/contexts/AuthContext";
import { useRefresh } from "@/contexts/RefreshContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface MenuCategory {
  id: string;
  name: string;
}

type TabValue = "active" | "completed";

const Cashier = () => {
  const { user } = useAuth();
  const { orders: wsOrders } = useWebSocket();
  const { refreshKey } = useRefresh();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Mobile navigation state - track if we're in detail view
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // Get cashier layout mode from feature flags
  const cashierLayoutMode =
    (user?.restaurant?.featureFlags?.cashier_layout_mode as string) || "both";

  // Determine if we should show POS mode
  // For backward compatibility, still check URL path
  const isPOSMode =
    location.pathname === "/pos" || cashierLayoutMode === "pos_only";

  const { execute: fetchOrders, loading: ordersLoading } = useApi<{
    data: APIOrder[];
  }>();
  const { execute: fetchMenuItems } = useApi<{ data: APIMenuItem[] }>();
  const { execute: fetchCategories } = useApi<{ data: MenuCategory[] }>();
  const { execute: processRefund, loading: refundLoading } = useApi();
  const { execute: addItemApi, loading: addItemsLoading } = useApi();
  const { execute: createTakeawayApi, loading: takeawayLoading } = useApi();

  const [activeOrders, setActiveOrders] = useState<APIOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<APIOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<APIOrder | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("active");

  // Dialog states
  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [isAddItemsOpen, setAddItemsOpen] = useState(false);
  const [isTakeawayOpen, setTakeawayOpen] = useState(false);
  const [isRefundConfirmOpen, setRefundConfirmOpen] = useState(false);
  const [paymentSuccessOrder, setPaymentSuccessOrder] =
    useState<APIOrder | null>(null);

  // Data states
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);

  // Ref for OrderDetail to access print function
  const orderDetailRef = useRef<OrderDetailRef>(null);

  const loadOrders = async () => {
    try {
      // Fetch both active and completed to ensure full sync
      const activeRes = await fetchOrders(() =>
        apiService.getActiveAndUnpaidOrders()
      );
      if (activeRes?.data) {
        setActiveOrders(activeRes.data);
      } else if (Array.isArray(activeRes)) {
        setActiveOrders(activeRes);
      }

      const completedRes = await fetchOrders(() =>
        apiService.getCompletedOrders()
      );
      if (completedRes?.data) {
        setCompletedOrders(completedRes.data);
      } else if (Array.isArray(completedRes)) {
        setCompletedOrders(completedRes);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
  };

  // Auto-refresh orders whenever WebSocket receives an update
  useEffect(() => {
    loadOrders();
  }, [wsOrders, refreshKey]);

  // Keep the selected order in sync with updates (e.g. items added by waiter)
  useEffect(() => {
    if (selectedOrder) {
      // Try to find the selected order in the new active list
      const updatedActiveOrder = activeOrders.find(
        (o) => o.id === selectedOrder.id
      );
      if (updatedActiveOrder && updatedActiveOrder !== selectedOrder) {
        setSelectedOrder(updatedActiveOrder);
        return;
      }
      // If not in active, check completed (e.g. just paid)
      const updatedCompletedOrder = completedOrders.find(
        (o) => o.id === selectedOrder.id
      );
      if (updatedCompletedOrder && updatedCompletedOrder !== selectedOrder) {
        setSelectedOrder(updatedCompletedOrder);
      }
    }
  }, [activeOrders, completedOrders]);

  useEffect(() => {
    const initData = async () => {
      const [itemsRes, categoriesRes] = await Promise.all([
        fetchMenuItems(() => apiService.getMenuItems()),
        fetchCategories(() => apiService.getMenuCategories()),
      ]);
      if (itemsRes?.data) {
        setMenuItems(itemsRes.data);
      } else if (Array.isArray(itemsRes)) {
        setMenuItems(itemsRes);
      }
      if (categoriesRes?.data) {
        setMenuCategories(categoriesRes.data);
      } else if (Array.isArray(categoriesRes)) {
        setMenuCategories(categoriesRes);
      }
    };
    initData();
  }, []);

  // Handle navigation state (e.g. coming from Table Management)
  useEffect(() => {
    if (location.state?.tableId && activeOrders.length > 0) {
      const order = activeOrders.find(
        (o) => o.tableId === location.state.tableId
      );
      if (order) {
        setSelectedOrder(order);
        setActiveTab("active");
      }
    } else if (location.state?.orderId) {
      const order =
        activeOrders.find((o) => o.id === location.state.orderId) ||
        completedOrders.find((o) => o.id === location.state.orderId);
      if (order) {
        setSelectedOrder(order);
        setActiveTab(
          activeOrders.some((o) => o.id === order.id) ? "active" : "completed"
        );
      }
    }
  }, [location.state, activeOrders, completedOrders]);

  const handleRefund = async () => {
    if (!selectedOrder) return;
    try {
      await processRefund(() => apiService.refundPayment(selectedOrder.id));
      toast({
        title: "Refund Processed",
        description: "The order has been refunded successfully.",
      });
      setRefundConfirmOpen(false);
      loadOrders();
    } catch (error) {
      toast({
        title: "Refund Failed",
        description: "Could not process refund. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddItems = async (
    orderId: string,
    items: { menuItemVariantId: string; quantity: number; note?: string }[]
  ) => {
    try {
      // Use correct API for cashier order
      const response = await addItemApi(() =>
        apiService.addItemsToCashierOrder(orderId, items)
      );
      toast({
        title: "Items Added",
        description: "Successfully added items to the order.",
      });
      setAddItemsOpen(false);
      // Update selected order with new data if available
      const orderResponse = response as { data?: APIOrder };
      if (orderResponse?.data) {
        setSelectedOrder(orderResponse.data);
      }
      loadOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add items.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTakeaway = async (
    items: { menuItemVariantId: string; quantity: number; note?: string }[]
  ) => {
    try {
      await createTakeawayApi(() => apiService.createTakeawayOrder(items));
      toast({
        title: "Order Created",
        description: "Takeaway order created successfully.",
      });
      setTakeawayOpen(false);
      loadOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create takeaway order.",
        variant: "destructive",
      });
    }
  };

  // Handler for order selection with mobile navigation
  const handleSelectOrder = (order: APIOrder) => {
    setSelectedOrder(order);
    if (isMobile) {
      setMobileShowDetail(true);
    }
  };

  // Handler for back navigation on mobile
  const handleBackToList = () => {
    setMobileShowDetail(false);
  };

  // Determine what to render based on cashier layout mode
  const renderContent = () => {
    if (cashierLayoutMode === "pos_only") {
      // Only show POS Terminal
      return (
        <div className="flex-1 overflow-hidden">
          <POSTerminal
            completedOrders={completedOrders}
            activeOrders={activeOrders}
          />
        </div>
      );
    }

    if (cashierLayoutMode === "manage_orders") {
      // Only show Manage Orders view
      return renderManageOrdersView();
    }

    // Default: "both" mode - use URL-based routing or tabs
    if (isPOSMode) {
      return (
        <div className="flex-1 overflow-hidden">
          <POSTerminal
            completedOrders={completedOrders}
            activeOrders={activeOrders}
          />
        </div>
      );
    }

    // Show manage orders view (default for "both" mode)
    return renderManageOrdersView();
  };

  // Manage Orders View with Mobile Master-Detail Pattern
  const renderManageOrdersView = () => {
    // Mobile: Show either list or detail, not both
    if (isMobile) {
      if (mobileShowDetail && (selectedOrder || paymentSuccessOrder)) {
        return (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Back button header */}
            <div className="pb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToList}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </div>
            {/* Full screen detail view */}
            <div className="flex-1 min-h-0">
              <OrderDetail
                ref={orderDetailRef}
                order={selectedOrder || paymentSuccessOrder!}
                onPay={() => setPaymentOpen(true)}
                onAddItems={() => setAddItemsOpen(true)}
                onRefund={() => setRefundConfirmOpen(true)}
              />
            </div>
          </div>
        );
      } else {
        // Show list view
        return (
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as TabValue)}
              className="h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Active ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedOrders.length})
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 min-h-0 mt-2">
                <TabsContent value="active" className="h-full m-0">
                  <OrderList
                    orders={activeOrders}
                    title="Active Orders"
                    onSelectOrder={handleSelectOrder}
                    selectedOrderId={selectedOrder?.id}
                  />
                </TabsContent>
                <TabsContent value="completed" className="h-full m-0">
                  <OrderList
                    orders={completedOrders}
                    title="Completed Orders"
                    onSelectOrder={handleSelectOrder}
                    selectedOrderId={selectedOrder?.id}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        );
      }
    }

    // Desktop: Show side-by-side grid layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left Column: Order Lists */}
        <div className="md:col-span-1 h-full flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 min-h-0 mt-2">
              <TabsContent value="active" className="h-full m-0">
                <OrderList
                  orders={activeOrders}
                  title="Active Orders"
                  onSelectOrder={handleSelectOrder}
                  selectedOrderId={selectedOrder?.id}
                />
              </TabsContent>
              <TabsContent value="completed" className="h-full m-0">
                <OrderList
                  orders={completedOrders}
                  title="Completed Orders"
                  onSelectOrder={handleSelectOrder}
                  selectedOrderId={selectedOrder?.id}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Column: Order Details */}
        <div className="md:col-span-2 h-full flex flex-col min-h-0">
          {selectedOrder || paymentSuccessOrder ? (
            <OrderDetail
              ref={orderDetailRef}
              order={selectedOrder || paymentSuccessOrder!}
              onPay={() => setPaymentOpen(true)}
              onAddItems={() => setAddItemsOpen(true)}
              onRefund={() => setRefundConfirmOpen(true)}
            />
          ) : (
            <div className="h-full flex items-center justify-center border rounded-lg bg-muted/10 text-muted-foreground">
              Select an order to view details
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-4 gap-4 flex flex-col">
      {cashierLayoutMode !== "pos_only" && !isPOSMode && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Cashier Station</h1>
            <div className="flex gap-2">
              <Button onClick={() => setTakeawayOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Takeaway
              </Button>
            </div>
          </div>
        </div>
      )}

      {renderContent()}

      {/* Dialogs */}
      {(selectedOrder || paymentSuccessOrder) && (
        <PaymentDialog
          open={isPaymentOpen}
          onOpenChange={(open) => {
            setPaymentOpen(open);
            if (!open) {
              setPaymentSuccessOrder(null);
            }
          }}
          order={selectedOrder || paymentSuccessOrder!}
          onPrintBill={() => orderDetailRef.current?.printBill()}
          onProcessPayment={async (paymentData) => {
            try {
              const response = await processRefund(() =>
                apiService.createPayment({
                  orderId: selectedOrder!.id,
                  amount: paymentData.amount,
                  paymentMethod: paymentData.method,
                  tenderedAmount: paymentData.tenderedAmount,
                  orderItemIds: paymentData.orderItemIds,
                })
              );

              toast({
                title: "Success",
                description: paymentData.tenderedAmount
                  ? `Payment successful. Change: ₹${(
                      (paymentData.tenderedAmount || 0) - paymentData.amount
                    ).toFixed(2)}`
                  : "Payment successful.",
              });

              // Fetch updated order with payment info
              const updatedOrder = await apiService.getOrderDetails(
                selectedOrder!.id
              );
              setPaymentSuccessOrder(updatedOrder.data);
              setSelectedOrder(updatedOrder.data);

              // Keep dialog open in success mode - don't close it
              // setPaymentOpen(false) is removed - dialog stays open

              loadOrders();
            } catch (error) {
              toast({
                title: "Error",
                description: "Payment failed.",
                variant: "destructive",
              });
            }
          }}
          isLoading={refundLoading}
        />
      )}

      {selectedOrder && (
        <AddItemsDialog
          open={isAddItemsOpen}
          onOpenChange={setAddItemsOpen}
          menuItems={menuItems}
          categories={menuCategories}
          onSubmit={(items) => handleAddItems(selectedOrder.id, items)}
          isLoading={addItemsLoading}
        />
      )}

      <TakeawayDialog
        open={isTakeawayOpen}
        onOpenChange={setTakeawayOpen}
        menuItems={menuItems}
        categories={menuCategories}
        onSubmit={handleCreateTakeaway}
        isLoading={takeawayLoading}
      />

      <AlertDialog
        open={isRefundConfirmOpen}
        onOpenChange={setRefundConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this order? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund} disabled={refundLoading}>
              {refundLoading ? "Processing..." : "Confirm Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cashier;
