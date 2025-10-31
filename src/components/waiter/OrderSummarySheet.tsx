import { APIOrder, OrderItemStatus } from "@/types/restaurant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Send } from "lucide-react";

interface CartItem {
  menuItemId: string;
  name: string;
  variantName?: string; // ✅ NEW
  note?: string; // ✅ NEW
  price: number;
  quantity: number;
}

interface OrderSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  existingOrder: APIOrder | null;
  onRemoveFromCart: (menuItemId: string) => void;
  onUpdateItemStatus: (itemId: string, status: "SERVED" | "CANCELLED") => void;
  onSendToKitchen: () => void;
  onCompleteOrder: () => void;
  isSending: boolean;
  isCompleting: boolean;
}

export function OrderSummarySheet({
  open,
  onOpenChange,
  cart,
  existingOrder,
  onRemoveFromCart,
  onUpdateItemStatus,
  onSendToKitchen,
  onCompleteOrder,
  isSending,
  isCompleting,
}: OrderSummarySheetProps) {
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const existingTotal = existingOrder?.totalAmount || 0;
  const grandTotal = existingTotal + cartTotal;

  const getItemStatusColor = (status: OrderItemStatus) => {
    switch (status) {
      case "ORDERED":
        return "border-primary bg-primary/10";
      case "PREPARING":
        return "border-warning bg-warning/10";
      case "PREPARED":
        return "border-success bg-success/10";
      case "SERVED":
        return "border-muted bg-muted/20";
      case "CANCELLED":
        return "border-destructive bg-destructive/10";
      default:
        return "border-muted";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Current Order</SheetTitle>
          <SheetDescription>
            {existingOrder
              ? `Table ${existingOrder.table?.tableNumber || "N/A"}`
              : "New Order"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {/* Existing Order Items */}
            {existingOrder && existingOrder.orderItems.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Current Items
                </h3>
                {existingOrder.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border-2 mb-2 ${getItemStatusColor(
                      item.status
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {item.quantity}x {item.menuItemVariant?.menuItem.name}{" "}
                          <span className="text-sm text-muted-foreground">
                            ({item.menuItemVariant?.name})
                          </span>
                        </div>

                        {/* ✅ Show special instructions */}
                        {item.note && (
                          <div className="text-sm text-muted-foreground italic mt-1">
                            Note: {item.note}
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                          ₹{item.price.toFixed(2)} each
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                        <div className="font-semibold">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        {item.status === "PREPARED" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              onUpdateItemStatus(item.id, "SERVED")
                            }
                          >
                            Mark Served
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Separator className="my-4" />
              </div>
            )}

            {/* ✅ New Cart Items */}
            {cart.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  New Items (to be sent)
                </h3>
                {cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="p-3 rounded-lg border bg-card mb-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {item.quantity}x {item.name}{" "}
                          {item.variantName && (
                            <span className="text-sm text-muted-foreground">
                              ({item.variantName})
                            </span>
                          )}
                        </div>

                        {/* ✅ Show note */}
                        {item.note && (
                          <div className="text-sm text-muted-foreground italic mt-1">
                            Note: {item.note}
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                          ₹{item.price.toFixed(2)} each
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemoveFromCart(item.menuItemId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length === 0 &&
              (!existingOrder || existingOrder.orderItems.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No items in order
                </div>
              )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>

          {cart.length > 0 && (
            <Button
              onClick={() => {
                onSendToKitchen();
                onOpenChange(false);
              }}
              disabled={isSending}
              className="w-full bg-gradient-primary"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? "Sending..." : "Send to Kitchen"}
            </Button>
          )}

          {existingOrder &&
            existingOrder.orderItems.length > 0 &&
            existingOrder.status !== "COMPLETED" && (
              <Button
                onClick={() => {
                  onCompleteOrder();
                  onOpenChange(false);
                }}
                disabled={isCompleting}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {isCompleting ? "Completing..." : "Complete Order"}
              </Button>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
