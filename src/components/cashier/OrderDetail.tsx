import { APIOrder, OrderItemStatus } from "@/types/restaurant";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  CreditCard,
  RefreshCw,
  Printer,
  Package,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface OrderDetailProps {
  order: APIOrder | null;
  onPay: () => void;
  onAddItems: () => void;
  onRefund: () => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  onPay,
  onAddItems,
  onRefund,
}) => {
  const { user } = useAuth();
  if (!order) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4" />
          <p>Select an order to view details</p>
        </div>
      </Card>
    );
  }

  const getStatusVariant = (
    status: OrderItemStatus
  ): "secondary" | "warning" | "success" | "default" | "destructive" => {
    switch (status) {
      case "ORDERED":
        return "secondary";
      case "PREPARING":
        return "warning";
      case "PREPARED":
        return "success";
      case "SERVED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "default";
    }
  };

  const isRefundable =
    order.status === "COMPLETED" && order.paymentStatus === "PAID";
  const isPayable =
    order.paymentStatus === "UNPAID" || order.paymentStatus === "PARTIAL";
  const canRefund = user?.role === "admin" || user?.role === "manager";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>
            {order.takeAway
              ? "Take-away"
              : `Table ${order.table?.tableNumber || ""}`}
          </span>
          <Badge variant="outline">#{order.id.substring(0, 8)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {item.quantity}x {item.menuItem?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @ ₹{Number(item.price).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₹{(item.quantity * Number(item.price)).toFixed(2)}
                  </p>
                  <Badge
                    variant={getStatusVariant(item.status)}
                    className="mt-1"
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-4 p-4 border-t">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-primary font-bold">
            <span>Amount Due</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onAddItems}
            disabled={isRefundable}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Items
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print Bill
          </Button>
        </div>
        {isPayable && (
          <Button size="lg" onClick={onPay}>
            <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
          </Button>
        )}
        {isRefundable && canRefund && (
          <Button size="lg" variant="destructive" onClick={onRefund}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refund Order
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
