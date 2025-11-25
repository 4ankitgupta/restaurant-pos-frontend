import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Wallet,
  Users,
  ListChecks,
  Receipt,
  Send,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { APIOrder } from "@/types/restaurant";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/apiConfig";

type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET";
type SplitMode = "FULL" | "EQUAL" | "ITEM";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: APIOrder | null;
  onProcessPayment: (paymentData: {
    method: PaymentMethod;
    amount: number;
    tenderedAmount?: number;
    orderItemIds?: string[];
  }) => void;
  isLoading: boolean;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  order,
  onProcessPayment,
  isLoading,
}) => {
  const { toast } = useToast();
  const [splitMode, setSplitMode] = useState<SplitMode>("FULL");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [splitCount, setSplitCount] = useState<number>(2);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [tenderedAmount, setTenderedAmount] = useState<string>("");
  const [currentSplitPayment, setCurrentSplitPayment] = useState<number>(1);

  // WhatsApp sharing state
  const [successMode, setSuccessMode] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [whatsappPhone, setWhatsappPhone] = useState<string>("+91");
  const [sendingWhatsApp, setSendingWhatsApp] = useState<boolean>(false);

  // Calculate remaining amount to be paid (stable reference)
  const remainingAmount = order ? Number(order.totalAmount) : 0;

  // Get unpaid items (stable reference)
  const unpaidItems =
    order?.orderItems.filter((item) => item.paymentStatus === "UNPAID") || [];

  // Calculate change
  const changeDue = tenderedAmount
    ? Math.max(0, Number(tenderedAmount) - amountToPay)
    : 0;

  // Initialize amount to pay based on mode
  useEffect(() => {
    if (!order) return;

    if (splitMode === "FULL") {
      const fullAmount = Number(order.totalAmount);
      setAmountToPay(fullAmount);
      setSelectedItemIds([]);
    } else if (splitMode === "EQUAL") {
      const perPersonAmount = Number(order.totalAmount) / splitCount;
      setAmountToPay(Number(perPersonAmount.toFixed(2)));
      setSelectedItemIds([]);
    } else if (splitMode === "ITEM") {
      // Calculate total of selected items
      const currentUnpaidItems = order.orderItems.filter(
        (item) => item.paymentStatus === "UNPAID"
      );
      const selectedTotal = currentUnpaidItems
        .filter((item) => selectedItemIds.includes(item.id))
        .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      setAmountToPay(Number(selectedTotal.toFixed(2)));
    }
  }, [
    splitMode,
    splitCount,
    selectedItemIds.join(","),
    order?.id,
    order?.totalAmount,
  ]);

  // Reset tendered amount when payment method changes
  useEffect(() => {
    if (paymentMethod !== "CASH") {
      setTenderedAmount("");
    }
  }, [paymentMethod]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSplitMode("FULL");
      setPaymentMethod("CASH");
      setSplitCount(2);
      setSelectedItemIds([]);
      setTenderedAmount("");
      setCurrentSplitPayment(1);
    }
  }, [open]);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleQuickCash = (amount: number) => {
    setTenderedAmount(amount.toString());
  };

  const handleProcessPayment = async () => {
    const paymentData = {
      method: paymentMethod,
      amount: amountToPay,
      ...(paymentMethod === "CASH" &&
        tenderedAmount && {
          tenderedAmount: Number(tenderedAmount),
        }),
      ...(splitMode === "ITEM" &&
        selectedItemIds.length > 0 && {
          orderItemIds: selectedItemIds,
        }),
    };

    // Call the parent's payment handler
    await onProcessPayment(paymentData);

    // For equal split, increment to next payment
    if (splitMode === "EQUAL" && currentSplitPayment < splitCount) {
      setCurrentSplitPayment((prev) => prev + 1);
      setTenderedAmount("");
    } else {
      // Payment completed - show WhatsApp sharing option
      setSuccessMode(true);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!whatsappPhone || whatsappPhone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    setSendingWhatsApp(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/${order?.id}/whatsapp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerName: customerName || undefined,
            customerPhone: whatsappPhone,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Bill Sent Successfully!",
          description: result.data?.creditsRemaining
            ? `Credits remaining: ${result.data.creditsRemaining}`
            : "Bill sent via WhatsApp",
        });
        // Close dialog after successful send
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        toast({
          title: "Failed to Send Bill",
          description: result.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      toast({
        title: "Error",
        description: "Failed to send bill via WhatsApp",
        variant: "destructive",
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleClose = () => {
    setSuccessMode(false);
    setCustomerName("");
    setWhatsappPhone("+91");
    onOpenChange(false);
  };

  const isPaymentValid = () => {
    if (amountToPay <= 0) return false;
    if (paymentMethod === "CASH" && tenderedAmount) {
      return Number(tenderedAmount) >= amountToPay;
    }
    if (splitMode === "ITEM" && selectedItemIds.length === 0) return false;
    return true;
  };

  if (!order) return null;

  // Success Mode - Show WhatsApp sharing UI
  if (successMode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Payment Successful!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-center text-gray-600">
              Would you like to send the bill to the customer via WhatsApp?
            </p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="whatsappPhone">WhatsApp Number *</Label>
                <Input
                  id="whatsappPhone"
                  placeholder="+91 9876543210"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  type="tel"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code (e.g., +91 for India)
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {sendingWhatsApp ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Bill
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <Tabs
          value={splitMode}
          onValueChange={(v) => setSplitMode(v as SplitMode)}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="FULL" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Full Bill
            </TabsTrigger>
            <TabsTrigger value="EQUAL" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Split Equally
            </TabsTrigger>
            <TabsTrigger value="ITEM" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Split by Item
            </TabsTrigger>
          </TabsList>

          <TabsContent value="FULL" className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Total Amount Due
              </p>
              <p className="text-5xl font-bold text-primary">
                ₹{Number(remainingAmount).toFixed(2)}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="EQUAL" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Number of People:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                  >
                    -
                  </Button>
                  <span className="font-bold w-12 text-center">
                    {splitCount}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  Per Person Amount
                </p>
                <p className="text-4xl font-bold text-primary">
                  ₹{amountToPay.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Payment {currentSplitPayment} of {splitCount}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ITEM" className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
              {unpaidItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All items have been paid for
                </p>
              ) : (
                unpaidItems.map((item) => {
                  const itemTotal = Number(item.price) * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={selectedItemIds.includes(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.menuItemVariant.menuItem.name} -{" "}
                            {item.menuItemVariant.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ₹
                            {Number(item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold">₹{itemTotal.toFixed(2)}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Selected Items Total
              </p>
              <p className="text-3xl font-bold text-primary">
                ₹{amountToPay.toFixed(2)}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Payment Method</Label>
          <div className="grid grid-cols-4 gap-3">
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

        {/* Cash Payment Details */}
        {paymentMethod === "CASH" && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="space-y-2">
              <Label>Amount to Collect</Label>
              <Input
                type="number"
                value={amountToPay}
                onChange={(e) => setAmountToPay(Number(e.target.value))}
                disabled={splitMode === "EQUAL"}
                className="text-xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label>Cash Received (Tendered)</Label>
              <Input
                type="number"
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(e.target.value)}
                placeholder="Enter amount received"
                className="text-xl font-bold"
              />
            </div>

            {/* Quick Denomination Buttons */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Quick Select
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500, 2000].map((denomination) => (
                  <Button
                    key={denomination}
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickCash(denomination)}
                    className="font-mono"
                  >
                    ₹{denomination}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTenderedAmount(amountToPay.toString())}
                  className="col-span-3"
                >
                  Exact Amount
                </Button>
              </div>
            </div>

            {/* Change Display */}
            {tenderedAmount && Number(tenderedAmount) >= amountToPay && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Change to Return
                </p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  ₹{changeDue.toFixed(2)}
                </p>
              </div>
            )}

            {tenderedAmount && Number(tenderedAmount) < amountToPay && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-500 rounded-lg text-center">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Insufficient amount! Need ₹
                  {(amountToPay - Number(tenderedAmount)).toFixed(2)} more
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={!isPaymentValid() || isLoading}
            className="font-bold"
          >
            {isLoading
              ? "Processing..."
              : `Complete Payment ₹${amountToPay.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
