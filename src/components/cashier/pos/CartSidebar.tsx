import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Printer, Receipt, ShoppingCart } from "lucide-react";
import { APIMenuItem, APIOrder } from "@/types/restaurant";
import { CartItemComponent } from "./CartItem";

interface CartItem {
  key: string;
  menuItemId: string;
  variantId: string;
  quantity: number;
  note?: string;
}

interface CartSidebarProps {
  currentOrder: APIOrder | null;
  cart: Map<string, CartItem>;
  menuItems: APIMenuItem[];
  grandTotal: number;
  hasOrderedItems: boolean;
  kotLoading: boolean;
  addItemsLoading: boolean;
  onSendToKitchen: () => void;
  onSettleAndPrint: () => void;
  onPrintBill: () => void;
  onPrintKOT: () => void;
  onQuantityChange: (key: string, op: "add" | "remove") => void;
  onEditNote: (key: string, note?: string, itemName?: string) => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  currentOrder,
  cart,
  menuItems,
  grandTotal,
  hasOrderedItems,
  kotLoading,
  addItemsLoading,
  onSendToKitchen,
  onSettleAndPrint,
  onPrintBill,
  onPrintKOT,
  onQuantityChange,
  onEditNote,
}) => {
  return (
    <div className="border rounded-md p-3 flex flex-col min-h-0 bg-background">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Current Order</h3>
        <Badge variant="secondary">Total: ₹{grandTotal.toFixed(2)}</Badge>
      </div>
      <Separator className="my-3" />

      <ScrollArea className="flex-1 -mr-3 pr-3">
        <div className="space-y-4">
          {/* Existing order items */}
          {currentOrder &&
            currentOrder.orderItems &&
            currentOrder.orderItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                  Kitchen / Served
                </div>
                {currentOrder.orderItems.map((item) => (
                  <CartItemComponent
                    key={item.id}
                    orderItem={item}
                    menuItems={menuItems}
                  />
                ))}
                <Separator />
              </div>
            )}

          {/* New cart items */}
          {cart.size > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider pl-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                New to Add
              </div>
              {Array.from(cart.values()).map((c) => (
                <CartItemComponent
                  key={c.key}
                  cartItem={c}
                  menuItems={menuItems}
                  onQuantityChange={onQuantityChange}
                  onEditNote={onEditNote}
                  isNew={true}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!currentOrder && cart.size === 0 && (
            <div className="text-center text-muted-foreground pt-12 flex flex-col items-center opacity-50">
              <div className="bg-muted p-4 rounded-full mb-3">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <p>Cart is empty</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator className="my-3" />

      {/* Action buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onSendToKitchen}
            disabled={kotLoading}
            variant="outline"
            className="border-primary/20 hover:bg-primary/5 hover:text-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            {kotLoading ? "Sending..." : "To Kitchen"}
          </Button>
          <Button
            onClick={onSettleAndPrint}
            disabled={kotLoading || addItemsLoading}
            className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
          >
            <Printer className="h-4 w-4 mr-2" />
            {kotLoading || addItemsLoading ? "..." : "Settle"}
          </Button>
        </div>
        {currentOrder && (
          <>
            <Button
              onClick={onPrintBill}
              variant="secondary"
              className="w-full"
              disabled={!currentOrder}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Print Bill
            </Button>
            <Button
              onClick={onPrintKOT}
              variant="secondary"
              className="w-full"
              disabled={!hasOrderedItems}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print KOT
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
