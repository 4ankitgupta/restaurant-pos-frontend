import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { APIOrder } from "@/types/restaurant";

interface MobileCartFooterProps {
  currentOrder: APIOrder | null;
  cartSize: number;
  grandTotal: number;
  onViewCart: () => void;
}

export const MobileCartFooter: React.FC<MobileCartFooterProps> = ({
  currentOrder,
  cartSize,
  grandTotal,
  onViewCart,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 p-3 safe-area-bottom">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Total Items</span>
          <span className="text-lg font-bold">
            {(currentOrder?.orderItems?.length || 0) + cartSize}
          </span>
        </div>
        <div className="flex flex-col items-end flex-1">
          <span className="text-xs text-muted-foreground">Total Amount</span>
          <span className="text-xl font-bold text-primary">
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>
        <Button
          size="lg"
          onClick={onViewCart}
          className="flex items-center gap-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>View Cart</span>
        </Button>
      </div>
    </div>
  );
};
