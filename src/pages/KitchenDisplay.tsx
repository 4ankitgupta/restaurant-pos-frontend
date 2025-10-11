import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";
import { OrderItemStatus } from "@/types/restaurant";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { ChefHat, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

const KitchenDisplay: React.FC = () => {
  const { orders, isConnected } = useWebSocket();

  const handleUpdateItemStatus = async (
    itemId: string,
    status: OrderItemStatus
  ) => {
    try {
      await apiService.updateOrderItemStatusByChef(itemId, status);
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

  const activeOrders = useMemo(() => {
    return orders
      .filter(
        (order) =>
          (order.status === "IN_PROGRESS" || order.status === "PENDING") &&
          order.orderItems.some(
            (item) => item.status === "ORDERED" || item.status === "PREPARING"
          )
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [orders]);

  // Categorize orders by status
  const newOrders = useMemo(
    () =>
      activeOrders.filter((order) =>
        order.orderItems.some((item) => item.status === "ORDERED")
      ),
    [activeOrders]
  );

  const preparingOrders = useMemo(
    () =>
      activeOrders.filter(
        (order) =>
          order.orderItems.some((item) => item.status === "PREPARING") &&
          !order.orderItems.some((item) => item.status === "ORDERED")
      ),
    [activeOrders]
  );

  const readyOrders = useMemo(
    () =>
      activeOrders.filter((order) =>
        order.orderItems.every(
          (item) =>
            item.status === "PREPARED" ||
            item.status === "SERVED" ||
            item.status === "CANCELLED"
        )
      ),
    [activeOrders]
  );

  const getTimeSinceOrder = (createdAt: string) => {
    const minutes = differenceInMinutes(new Date(), parseISO(createdAt));
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} mins ago`;
  };

  const getTimeColor = (createdAt: string) => {
    const minutes = differenceInMinutes(new Date(), parseISO(createdAt));
    if (minutes > 15) return "text-destructive";
    if (minutes > 10) return "text-warning";
    return "text-muted-foreground";
  };

  const OrderCard = ({ order }: { order: any }) => {
    const allPreparing = order.orderItems.every(
      (item: any) =>
        item.status === "PREPARING" ||
        item.status === "PREPARED" ||
        item.status === "SERVED" ||
        item.status === "CANCELLED"
    );
    const allPrepared = order.orderItems.every(
      (item: any) =>
        item.status === "PREPARED" ||
        item.status === "SERVED" ||
        item.status === "CANCELLED"
    );

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="h-full flex flex-col shadow-lg border-l-4 border-l-primary">
          <CardHeader className="pb-3 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  Table {order.table?.tableNumber || "N/A"}
                </CardTitle>
                <p className={`text-sm font-medium ${getTimeColor(order.createdAt)}`}>
                  <Clock className="h-3 w-3 inline mr-1" />
                  {getTimeSinceOrder(order.createdAt)}
                </p>
              </div>
              {differenceInMinutes(new Date(), parseISO(order.createdAt)) > 15 && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-2 pb-4">
            {order.orderItems
              .filter(
                (item: any) =>
                  item.status === "ORDERED" || item.status === "PREPARING"
              )
              .map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-lg">
                        {item.quantity}x {item.menuItem?.name || "..."}
                      </p>
                      {item.status === "ORDERED" && (
                        <Badge variant="secondary" className="mt-1">
                          New
                        </Badge>
                      )}
                      {item.status === "PREPARING" && (
                        <Badge className="mt-1 bg-warning text-warning-foreground">
                          Preparing
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {item.status === "ORDERED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap"
                          onClick={() =>
                            handleUpdateItemStatus(item.id, "PREPARING")
                          }
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {item.status === "PREPARING" && (
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90 whitespace-nowrap"
                          onClick={() =>
                            handleUpdateItemStatus(item.id, "PREPARED")
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Ready
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const KanbanColumn = ({
    title,
    orders,
    count,
    icon: Icon,
    colorClass,
  }: {
    title: string;
    orders: any[];
    count: number;
    icon: any;
    colorClass: string;
  }) => (
    <div className="flex flex-col h-full">
      <div className={`p-4 rounded-t-lg ${colorClass}`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <h2 className="font-bold text-lg">{title}</h2>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {count}
          </Badge>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-muted/20 rounded-b-lg">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </AnimatePresence>
        {orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No orders in this stage</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Live order updates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                isConnected ? "bg-success animate-pulse" : "bg-destructive"
              }`}
            />
            <span className="text-sm font-medium hidden md:inline">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          <KanbanColumn
            title="New Orders"
            orders={newOrders}
            count={newOrders.length}
            icon={AlertCircle}
            colorClass="bg-secondary"
          />
          <KanbanColumn
            title="Preparing"
            orders={preparingOrders}
            count={preparingOrders.length}
            icon={Clock}
            colorClass="bg-warning"
          />
          <KanbanColumn
            title="Ready for Pickup"
            orders={readyOrders}
            count={readyOrders.length}
            icon={CheckCircle2}
            colorClass="bg-success"
          />
        </div>

        {activeOrders.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center py-20">
              <ChefHat className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-2xl font-semibold text-muted-foreground">
                No active orders
              </h2>
              <p className="text-muted-foreground/70 mt-2">
                New orders will appear here automatically
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDisplay;
