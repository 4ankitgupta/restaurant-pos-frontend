import { APIOrder } from "@/types/restaurant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

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
      <CardContent className="p-0 flex-1">
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
                  <div className="font-bold">
                    {order.takeAway
                      ? "Take-away"
                      : `Table ${order.table?.tableNumber || ""}`}
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
                    ₹{order.totalAmount.toFixed(2)}
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
