import { APIOrder } from "@/types/restaurant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Bike } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
      <CardContent className={`p-0 flex-1 min-h-0 ${isMobile ? "" : ""}`}>
        <ScrollArea className="h-full">
          <div className={`space-y-2 ${isMobile ? "p-2" : "p-4 space-y-3"}`}>
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`rounded-lg cursor-pointer transition-all active:scale-[0.98] ${
                  isMobile ? "p-3 min-h-[100px]" : "p-3"
                } ${
                  selectedOrderId === order.id
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-muted/50 hover:bg-muted active:bg-muted"
                } border`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div
                      className={`font-bold flex items-center gap-2 flex-wrap ${
                        isMobile ? "text-base" : ""
                      }`}
                    >
                      <span className="truncate">
                        {order.orderType === "DELIVERY_ZOMATO" ||
                        order.orderType === "DELIVERY_SWIGGY" ||
                        order.orderType === "DELIVERY_OTHER"
                          ? "Delivery"
                          : order.takeAway
                          ? "Take-away"
                          : `Table ${order.table?.tableNumber || ""}`}
                      </span>
                      {order.orderType === "DELIVERY_ZOMATO" && (
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1 text-[10px] h-5 shrink-0"
                        >
                          <Bike className="h-2.5 w-2.5" />
                          Zomato
                        </Badge>
                      )}
                      {order.orderType === "DELIVERY_SWIGGY" && (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1 text-[10px] h-5 bg-orange-500 shrink-0"
                        >
                          <Bike className="h-2.5 w-2.5" />
                          Swiggy
                        </Badge>
                      )}
                      {order.orderType === "DELIVERY_OTHER" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 text-[10px] h-5 shrink-0"
                        >
                          <Bike className="h-2.5 w-2.5" />
                          Delivery
                        </Badge>
                      )}
                    </div>
                    {order.customerName && (
                      <div
                        className={`text-muted-foreground truncate ${
                          isMobile ? "text-xs" : "text-xs"
                        }`}
                      >
                        {order.customerName}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={getPaymentStatusVariant(order.paymentStatus)}
                    className={`shrink-0 ${
                      isMobile ? "text-[10px] h-5" : "text-xs"
                    }`}
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                {!isMobile && (
                  <div className="text-sm text-muted-foreground mt-1">
                    ID: #{order.id.substring(0, 8)}...
                  </div>
                )}
                <div className="flex justify-between items-end mt-2 gap-2">
                  <div
                    className={`text-muted-foreground ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    {format(new Date(order.createdAt), "p")}
                  </div>
                  <div
                    className={`font-bold ${isMobile ? "text-lg" : "text-lg"}`}
                  >
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
