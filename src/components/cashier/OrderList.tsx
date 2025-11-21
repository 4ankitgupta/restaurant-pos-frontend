import { APIOrder } from "@/types/restaurant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Bike } from "lucide-react";

interface OrderListProps {
  orders: APIOrder[];
  title: string;
  onSelectOrder: (order: APIOrder) => void;
  selectedOrderId?: string;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  title,
  onSelectOrder,
  selectedOrderId,
}) => {
  const getPaymentStatusVariant = (
    status: APIOrder["paymentStatus"]
  ): "destructive" | "warning" | "success" | "default" => {
    switch (status) {
      case "UNPAID":
        return "destructive";
      case "PARTIAL":
        return "warning";
      case "PAID":
        return "success";
      case "REFUNDED":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedOrderId === order.id
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/50 hover:bg-muted"
                } border`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="font-bold flex items-center gap-2">
                      {order.orderType === "DELIVERY_ZOMATO" ||
                      order.orderType === "DELIVERY_SWIGGY" ||
                      order.orderType === "DELIVERY_OTHER"
                        ? "Delivery"
                        : order.takeAway
                        ? "Take-away"
                        : `Table ${order.table?.tableNumber || ""}`}
                      {order.orderType === "DELIVERY_ZOMATO" && (
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1 text-xs"
                        >
                          <Bike className="h-2.5 w-2.5" />
                          Zomato
                        </Badge>
                      )}
                      {order.orderType === "DELIVERY_SWIGGY" && (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1 text-xs bg-orange-500"
                        >
                          <Bike className="h-2.5 w-2.5" />
                          Swiggy
                        </Badge>
                      )}
                      {order.orderType === "DELIVERY_OTHER" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 text-xs"
                        >
                          <Bike className="h-2.5 w-2.5" />
                          Delivery
                        </Badge>
                      )}
                    </div>
                    {order.customerName && (
                      <div className="text-xs text-muted-foreground">
                        {order.customerName}
                      </div>
                    )}
                  </div>
                  <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ID: #{order.id.substring(0, 8)}...
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "p")}
                  </div>
                  <div className="font-bold text-lg">
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
