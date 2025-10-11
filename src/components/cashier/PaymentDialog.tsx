import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";

type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onProcessPayment: (method: PaymentMethod) => void;
  isLoading: boolean;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  totalAmount,
  onProcessPayment,
  isLoading,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">Total Amount Due</p>
            <p className="text-4xl font-bold">
              ₹{Number(totalAmount).toFixed(2)}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === "CASH" ? "default" : "outline"}
                onClick={() => setPaymentMethod("CASH")}
                className="flex-col h-20"
              >
                <DollarSign className="h-6 w-6 mb-1" />
                <span>Cash</span>
              </Button>
              <Button
                variant={paymentMethod === "CARD" ? "default" : "outline"}
                onClick={() => setPaymentMethod("CARD")}
                className="flex-col h-20"
              >
                <CreditCard className="h-6 w-6 mb-1" />
                <span>Card</span>
              </Button>
              <Button
                variant={paymentMethod === "UPI" ? "default" : "outline"}
                onClick={() => setPaymentMethod("UPI")}
                className="flex-col h-20"
              >
                <Smartphone className="h-6 w-6 mb-1" />
                <span>UPI</span>
              </Button>
              <Button
                variant={paymentMethod === "WALLET" ? "default" : "outline"}
                onClick={() => setPaymentMethod("WALLET")}
                className="flex-col h-20"
              >
                <Wallet className="h-6 w-6 mb-1" />
                <span>Wallet</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => onProcessPayment(paymentMethod)}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Complete Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
