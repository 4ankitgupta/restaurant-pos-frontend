import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";
import { OrderItemStatus, APIOrder } from "@/types/restaurant";
import { ChefHat, Clock, CheckCircle } from "lucide-react";
import { OrderTimer, useOrderBorderColor } from "@/components/kitchen/OrderTimer";

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

  // Separate orders by status for Kanban view
  const newOrders = activeOrders.filter((order) =>
    order.orderItems.some((item) => item.status === "ORDERED")
  );

  const preparingOrders = activeOrders.filter(
    (order) =>
      order.orderItems.every((item) => item.status !== "ORDERED") &&
      order.orderItems.some((item) => item.status === "PREPARING")
  );

  const OrderCard = ({ order }: { order: APIOrder }) => {
    const borderColor = useOrderBorderColor(order.createdAt);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={`border-2 ${borderColor} h-full flex flex-col shadow-md rounded-xl hover:shadow-lg transition-shadow`}
        >
          <CardHeader className="p-4 bg-muted/30">
            <CardTitle className="flex justify-between items-center">
              <span className="text-3xl font-bold">
                Table {order.table?.tableNumber || "Takeaway"}
              </span>
              <OrderTimer createdAt={order.createdAt} />
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 flex-grow space-y-3">
            {order.orderItems
              .filter(
                (item) =>
                  item.status === "ORDERED" || item.status === "PREPARING"
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-4 bg-card rounded-lg border-2 border-muted hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-primary">
                        {item.quantity}×
                      </div>
                      <div>
                        <div className="text-xl font-bold">
                          {item.menuItem?.name || "..."}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {item.status === "ORDERED" && (
                      <Button
                        size="lg"
                        className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground font-semibold"
                        onClick={() =>
                          handleUpdateItemStatus(item.id, "PREPARING")
                        }
                      >
                        <Clock className="h-5 w-5 mr-2" />
                        Start Preparing
                      </Button>
                    )}
                    {item.status === "PREPARING" && (
                      <Button
                        size="lg"
                        className="flex-1 bg-success hover:bg-success/90 text-success-foreground font-semibold"
                        onClick={() =>
                          handleUpdateItemStatus(item.id, "PREPARED")
                        }
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Mark Ready
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="bg-muted/20 min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ChefHat className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">
            Kitchen Display
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-success" : "bg-destructive"
            }`}
          ></span>
          <span className="text-sm font-medium">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      {/* Desktop: Kanban View, Mobile/Tablet: Single Column */}
      <div className="hidden xl:block">
        <div className="grid grid-cols-2 gap-6">
          {/* New Orders Column */}
          <div>
            <div className="mb-4 flex items-center justify-between bg-card p-4 rounded-lg border-2 border-primary">
              <h2 className="text-2xl font-bold">New Orders</h2>
              <Badge variant="default" className="text-lg px-3 py-1">
                {newOrders.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {newOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {newOrders.length === 0 && (
                <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">No new orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Preparing Column */}
          <div>
            <div className="mb-4 flex items-center justify-between bg-card p-4 rounded-lg border-2 border-warning">
              <h2 className="text-2xl font-bold">Preparing</h2>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {preparingOrders.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {preparingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {preparingOrders.length === 0 && (
                <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">
                    No orders being prepared
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet: Grid View */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:hidden gap-6">
        {activeOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {activeOrders.length === 0 && (
          <div className="col-span-full text-center py-20">
            <h2 className="text-3xl font-semibold text-muted-foreground">
              No active orders
            </h2>
            <p className="text-muted-foreground mt-2">
              New orders will appear here automatically.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDisplay;
