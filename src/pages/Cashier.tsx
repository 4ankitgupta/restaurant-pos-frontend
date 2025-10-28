// src/pages/Cashier.tsx
import { useState, useEffect } from "react";
import { APIOrder, APIMenuItem } from "@/types/restaurant";
import { useApi } from "@/hooks/useApi";
import { apiService } from "@/services/apiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrderList } from "@/components/cashier/OrderList";
import { OrderDetail } from "@/components/cashier/OrderDetail";
import { PaymentDialog } from "@/components/cashier/PaymentDialog";
import { AddItemsDialog } from "@/components/cashier/AddItemsDialog";
import { TakeawayDialog } from "@/components/cashier/TakeawayDialog";
import { toast } from "@/hooks/use-toast";
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

import { useRefresh } from "@/contexts/RefreshContext";

interface MenuCategory {
  id: string;
  name: string;
}

type TabValue = "active" | "completed";

const Cashier = () => {
  const [activeOrders, setActiveOrders] = useState<APIOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<APIOrder[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]); // <-- ADD THIS
  const [selectedOrder, setSelectedOrder] = useState<APIOrder | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("active");

  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [isAddItemsOpen, setAddItemsOpen] = useState(false);
  const [isTakeawayOpen, setTakeawayOpen] = useState(false);
  const [isRefundConfirmOpen, setRefundConfirmOpen] = useState(false);

  // API Hooks
  const { loading: loadingActive, execute: fetchActive } = useApi<{
    data: APIOrder[];
  }>();
  const { loading: loadingCompleted, execute: fetchCompleted } = useApi<{
    data: APIOrder[];
  }>();
  const { execute: fetchMenu } = useApi<{ data: APIMenuItem[] }>();
  const { execute: fetchCategories } = useApi<{ data: MenuCategory[] }>();
  const { loading: paymentLoading, execute: executePayment } = useApi();
  const { loading: addItemsLoading, execute: executeAddItems } = useApi<{
    data: APIOrder;
  }>();
  const { loading: takeawayLoading, execute: executeTakeaway } = useApi();
  const { loading: refundLoading, execute: executeRefund } = useApi();

  const { refreshKey } = useRefresh();

  const fetchData = async () => {
    try {
      const [activeRes, completedRes, menuRes, categoriesRes] =
        await Promise.all([
          fetchActive(() => apiService.getActiveAndUnpaidOrders()),
          fetchCompleted(() => apiService.getCompletedOrders()),
          fetchMenu(() => apiService.getMenuItems()),
          fetchCategories(() => apiService.getMenuCategories()),
        ]);

      if (activeRes) setActiveOrders(activeRes.data);
      if (completedRes) setCompletedOrders(completedRes.data);
      if (menuRes) setMenuItems(menuRes.data);
      if (categoriesRes) setMenuCategories(categoriesRes.data);
    } catch (error) {
      console.error("Failed to fetch cashier data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleSelectOrder = (order: APIOrder) => {
    setSelectedOrder(order);
  };

  const handleProcessPayment = async (
    method: "CASH" | "CARD" | "UPI" | "WALLET"
  ) => {
    if (!selectedOrder) return;
    try {
      await executePayment(() =>
        apiService.createPayment({
          orderId: selectedOrder.id,
          amount: Number(selectedOrder.totalAmount),
          paymentMethod: method,
        })
      );
      toast({ title: "Success", description: "Payment successful." });
      setPaymentOpen(false);
      setSelectedOrder(null);
      fetchData(); // Refresh all data
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  const handleAddItems = async (
    items: { menuItemId: string; quantity: number }[]
  ) => {
    if (!selectedOrder) return;
    try {
      const response = await executeAddItems(() =>
        apiService.addItemsToCashierOrder(selectedOrder.id, items)
      );
      toast({ title: "Success", description: "Items added successfully." });
      setAddItemsOpen(false);
      setSelectedOrder(response.data); // Update selected order with new data
      fetchData();
    } catch (error) {
      console.error("Failed to add items:", error);
    }
  };

  const handleCreateTakeaway = async (
    items: { menuItemId: string; quantity: number }[]
  ) => {
    try {
      await executeTakeaway(() => apiService.createTakeawayOrder(items));
      toast({
        title: "Success",
        description: "Take-away order created.",
      });
      setTakeawayOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to create take-away order:", error);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder) return;
    try {
      await executeRefund(() => apiService.refundPayment(selectedOrder.id));
      toast({ title: "Success", description: "Order has been refunded." });
      setRefundConfirmOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      console.error("Refund failed:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col p-4 gap-4 bg-muted/20">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cashier Station</h1>
        <Button onClick={() => setTakeawayOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Take-away
        </Button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Left column for the order list */}
        <div className="lg:col-span-1 flex flex-col overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            className="flex flex-col flex-1"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active & Unpaid</TabsTrigger>
              <TabsTrigger value="completed">Completed Today</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="flex-1 min-h-0">
              <OrderList
                orders={activeOrders}
                title="Active & Unpaid Orders"
                onSelectOrder={handleSelectOrder}
                selectedOrderId={selectedOrder?.id}
              />
            </TabsContent>
            <TabsContent value="completed" className="flex-1 min-h-0">
              <OrderList
                orders={completedOrders}
                title="Completed Orders"
                onSelectOrder={handleSelectOrder}
                selectedOrderId={selectedOrder?.id}
              />
            </TabsContent>
          </Tabs>
        </div>
        {/* Right column for order details */}
        <div className="lg:col-span-2 overflow-y-auto">
          <OrderDetail
            order={selectedOrder}
            onPay={() => setPaymentOpen(true)}
            onAddItems={() => setAddItemsOpen(true)}
            onRefund={() => setRefundConfirmOpen(true)}
          />
        </div>
      </div>
      {/* Dialogs */}
      {selectedOrder && (
        <PaymentDialog
          open={isPaymentOpen}
          onOpenChange={setPaymentOpen}
          totalAmount={selectedOrder.totalAmount}
          onProcessPayment={handleProcessPayment}
          isLoading={paymentLoading}
        />
      )}
      {selectedOrder && (
        <AddItemsDialog
          open={isAddItemsOpen}
          onOpenChange={setAddItemsOpen}
          menuItems={menuItems}
          categories={menuCategories} // <-- PASS CATEGORIES
          onSubmit={handleAddItems}
          isLoading={addItemsLoading}
        />
      )}
      <TakeawayDialog
        open={isTakeawayOpen}
        onOpenChange={setTakeawayOpen}
        menuItems={menuItems}
        categories={menuCategories} // <-- PASS CATEGORIES
        onSubmit={handleCreateTakeaway}
        isLoading={takeawayLoading}
      />
      {selectedOrder && (
        <AlertDialog
          open={isRefundConfirmOpen}
          onOpenChange={setRefundConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to refund this order? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRefund}
                disabled={refundLoading}
              >
                {refundLoading ? "Refunding..." : "Confirm Refund"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Cashier;
