// src/pages/KitchenDisplay.tsx

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";
import { OrderItemStatus } from "@/types/restaurant";
import { format, parseISO } from "date-fns";
import { ChefHat, Clock, CheckCircle } from "lucide-react";
import { useRefresh } from "@/contexts/RefreshContext";
import { Order, APIOrder } from "@/types/restaurant";

const KitchenDisplay: React.FC = () => {
  const { orders: initialOrders, isConnected } = useWebSocket();
  const [orders, setOrders] = useState<APIOrder[]>(initialOrders);
  const { refreshKey } = useRefresh();

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiService.getAllOrders();
        setOrders(response.data);
        toast({
          title: "Success",
          description: "Orders have been refreshed.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch latest orders.",
          variant: "destructive",
        });
      }
    };

    if (refreshKey > 0) {
      fetchOrders();
    }
  }, [refreshKey]);

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
        (order) => order.status === "IN_PROGRESS" || order.status === "PENDING"
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [orders, refreshKey]);

  const getStatusColor = (status: OrderItemStatus) => {
    switch (status) {
      case "ORDERED":
        return "bg-blue-500";
      case "PREPARING":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 text-gray-800">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ChefHat className="h-10 w-10 text-gray-700" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Kitchen Display
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-sm font-medium text-gray-600">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.map((order) => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white border-gray-200 h-full flex flex-col shadow-md rounded-xl">
              <CardHeader className="p-4">
                <CardTitle className="flex justify-between items-center text-2xl font-bold text-gray-900">
                  <span>Table {order.table?.tableNumber || "N/A"}</span>
                  <span className="text-sm font-medium text-gray-500">
                    {format(parseISO(order.createdAt), "p")}
                  </span>
                </CardTitle>

                {/* --- Bulk Action Buttons --- */}
                <div className="mt-3 flex gap-2">
                  {order.orderItems.some(
                    (item) => item.status === "ORDERED"
                  ) && (
                    <Button
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                      onClick={async () => {
                        for (const item of order.orderItems) {
                          if (item.status === "ORDERED") {
                            await handleUpdateItemStatus(item.id, "PREPARING");
                          }
                        }
                        toast({
                          title: "Success",
                          description: "All items marked as preparing.",
                        });
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" /> Mark All Preparing
                    </Button>
                  )}

                  {order.orderItems.every(
                    (item) => item.status === "PREPARING"
                  ) && (
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                      onClick={async () => {
                        for (const item of order.orderItems) {
                          if (item.status === "PREPARING") {
                            await handleUpdateItemStatus(item.id, "PREPARED");
                          }
                        }
                        toast({
                          title: "Success",
                          description: "All items marked as ready.",
                        });
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Mark All Ready
                    </Button>
                  )}
                </div>
              </CardHeader>

              <Separator className="border-gray-200" />
              <CardContent className="p-4 flex-grow space-y-4">
                {order.orderItems.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 italic">
                    No items in this order yet
                  </div>
                ) : (
                  order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full mr-4 flex-shrink-0 ${getStatusColor(
                            item.status
                          )}`}
                        ></span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-lg text-gray-800">
                            {item.quantity}x{" "}
                            {item.menuItemVariant?.menuItem?.name || "..."}
                          </span>
                          {item.menuItemVariant?.name && (
                            <span className="text-sm text-muted-foreground">
                              {item.menuItemVariant.name}
                            </span>
                          )}
                          {item.note && (
                            <span className="text-sm italic text-rose-600">
                              Note: {item.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status === "ORDERED" && (
                          <Button
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                            onClick={() =>
                              handleUpdateItemStatus(item.id, "PREPARING")
                            }
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Prepare
                          </Button>
                        )}
                        {item.status === "PREPARING" && (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                            onClick={() =>
                              handleUpdateItemStatus(item.id, "PREPARED")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Ready
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {activeOrders.length === 0 && (
          <div className="col-span-full text-center py-20">
            <h2 className="text-3xl font-semibold text-gray-500">
              No active orders
            </h2>
            <p className="text-gray-400 mt-2">
              New orders will appear here automatically.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDisplay;
