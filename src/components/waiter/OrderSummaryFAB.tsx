import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface OrderSummaryFABProps {
  itemCount: number;
  totalAmount: number;
  onClick: () => void;
}

export function OrderSummaryFAB({
  itemCount,
  totalAmount,
  onClick,
}: OrderSummaryFABProps) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 md:hidden">
      <Button
        onClick={onClick}
        size="lg"
        className="bg-gradient-primary shadow-lg px-6 py-6 rounded-full"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        View Order ({itemCount} items) - ₹{totalAmount.toFixed(2)}
      </Button>
    </div>
  );
}
