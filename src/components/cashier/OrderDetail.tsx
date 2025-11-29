import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { APIOrder, OrderItemStatus } from "@/types/restaurant";
import { BillReceipt } from "./BillReceipt";
import { KOTReceipt } from "./KOTReceipt";
import "./KOTReceipt.css";
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
  Bike,
  Phone,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedName } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface OrderDetailRef {
  printBill: () => void;
  printKOT: () => void;
}

interface OrderDetailProps {
  order: APIOrder | null;
  onPay: () => void;
  onAddItems: () => void;
  onRefund: () => void;
}

export const OrderDetail = React.forwardRef<OrderDetailRef, OrderDetailProps>(
  ({ order, onPay, onAddItems, onRefund }, ref) => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const isMobile = useIsMobile();
    const billReceiptRef = useRef<HTMLDivElement>(null);
    const kotReceiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
      documentTitle: `Order-${order?.id?.substring(0, 8) || ""}`,
      contentRef: billReceiptRef,
    });

    const handlePrintKOT = useReactToPrint({
      documentTitle: `KOT-${order?.id?.substring(0, 8) || ""}`,
      contentRef: kotReceiptRef,
    });

    // Expose print functions to parent via ref
    React.useImperativeHandle(ref, () => ({
      printBill: () => {
        handlePrint();
      },
      printKOT: () => {
        handlePrintKOT();
      },
    }));

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

    // Check if there are any ordered items for KOT
    const hasOrderedItems = order.orderItems.some(
      (item) => item.status === "ORDERED" || item.status === "PENDING"
    );

    return (
      <>
        <Card className={`h-full flex flex-col ${isMobile ? "pb-0" : ""}`}>
          <CardHeader className={isMobile ? "pb-3" : ""}>
            <CardTitle
              className={`flex justify-between items-center ${
                isMobile ? "text-base" : ""
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={isMobile ? "text-base" : ""}>
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
                    className={`flex items-center gap-1 ${
                      isMobile ? "text-[10px] h-5" : ""
                    }`}
                  >
                    <Bike className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                    Zomato
                  </Badge>
                )}
                {order.orderType === "DELIVERY_SWIGGY" && (
                  <Badge
                    variant="default"
                    className={`flex items-center gap-1 bg-orange-500 ${
                      isMobile ? "text-[10px] h-5" : ""
                    }`}
                  >
                    <Bike className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                    Swiggy
                  </Badge>
                )}
                {order.orderType === "DELIVERY_OTHER" && (
                  <Badge
                    variant="secondary"
                    className={`flex items-center gap-1 ${
                      isMobile ? "text-[10px] h-5" : ""
                    }`}
                  >
                    <Bike className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                    Delivery
                  </Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className={isMobile ? "text-[10px]" : ""}
              >
                #{order.id.substring(0, 8)}
              </Badge>
            </CardTitle>

            {/* Customer Info for Delivery Orders */}
            {(order.orderType === "DELIVERY_ZOMATO" ||
              order.orderType === "DELIVERY_SWIGGY" ||
              order.orderType === "DELIVERY_OTHER") && (
              <div
                className={`space-y-1 text-muted-foreground ${
                  isMobile ? "mt-2 text-xs" : "mt-3 space-y-2 text-sm"
                }`}
              >
                {order.customerName && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Customer:</span>
                    <span>{order.customerName}</span>
                  </div>
                )}
                {order.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                    <span>{order.customerPhone}</span>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin
                      className={`flex-shrink-0 ${
                        isMobile ? "h-2.5 w-2.5 mt-0.5" : "h-3 w-3 mt-0.5"
                      }`}
                    />
                    <span className="line-clamp-2">
                      {order.deliveryAddress}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent
            className={`flex-1 overflow-hidden p-0 min-h-0 ${
              isMobile ? "mb-24" : ""
            }`}
          >
            <ScrollArea className="h-full">
              <div
                className={`space-y-3 ${
                  isMobile ? "p-3 pb-4" : "p-6 space-y-4"
                }`}
              >
                {order.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between gap-2 ${
                      isMobile ? "py-2 border-b last:border-b-0" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isMobile ? "text-sm" : ""}`}>
                        {item.quantity}x{" "}
                        {getLocalizedName(
                          item.menuItemVariant?.menuItem as any,
                          language
                        )}{" "}
                        (
                        {getLocalizedName(
                          item.menuItemVariant as any,
                          language
                        )}
                        )
                      </p>
                      {item.note && (
                        <p
                          className={`text-muted-foreground italic ${
                            isMobile ? "text-xs mt-0.5" : "text-sm"
                          }`}
                        >
                          Note: {item.note}
                        </p>
                      )}
                      <p
                        className={`text-muted-foreground ${
                          isMobile ? "text-xs mt-0.5" : "text-sm"
                        }`}
                      >
                        @ ₹{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-semibold ${isMobile ? "text-sm" : ""}`}
                      >
                        ₹{(item.quantity * Number(item.price)).toFixed(2)}
                      </p>
                      <Badge
                        variant={getStatusVariant(item.status)}
                        className={`${
                          isMobile ? "mt-1 text-[10px] h-5" : "mt-1"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Desktop Footer - Traditional Layout */}
          {!isMobile && (
            <CardFooter className="flex-col items-stretch space-y-4 p-4 border-t">
              <div className="space-y-2 text-lg">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                </div>

                {/* Payment Information */}
                {order.payments && order.payments.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center text-sm bg-muted/30 p-3 rounded-md">
                      <span className="text-muted-foreground font-medium">
                        Paid via:
                      </span>
                      <div className="flex gap-2">
                        {order.payments.map((payment) => (
                          <Badge key={payment.id} variant="outline">
                            {payment.paymentMethod}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex justify-between text-primary font-bold">
                  <span>Amount Due</span>
                  <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={onAddItems}
                  disabled={
                    order.status === "COMPLETED" &&
                    order.paymentStatus === "PAID"
                  }
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Items
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print Bill
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrintKOT}
                  disabled={!hasOrderedItems}
                >
                  <Printer className="mr-2 h-4 w-4" /> Print KOT
                </Button>
              </div>
              {(order.paymentStatus === "UNPAID" ||
                order.paymentStatus === "PARTIAL") && (
                <Button size="lg" onClick={onPay}>
                  <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
                </Button>
              )}
              {order.status === "COMPLETED" &&
                order.paymentStatus === "PAID" &&
                (user?.role === "admin" || user?.role === "manager") && (
                  <Button size="lg" variant="destructive" onClick={onRefund}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refund Order
                  </Button>
                )}
            </CardFooter>
          )}
        </Card>

        {/* Mobile Sticky Footer - Action Bar */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 safe-area-bottom">
            {/* Total Summary Bar */}
            <div className="px-4 py-2 border-b bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-primary">
                  ₹{Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
              {order.payments && order.payments.length > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    Paid via{" "}
                    {order.payments.map((p) => p.paymentMethod).join(", ")}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    Paid
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddItems}
                  disabled={
                    order.status === "COMPLETED" &&
                    order.paymentStatus === "PAID"
                  }
                  className="h-10"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="ml-1 text-xs">Add</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-10"
                >
                  <Printer className="h-4 w-4" />
                  <span className="ml-1 text-xs">Bill</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintKOT}
                  disabled={!hasOrderedItems}
                  className="h-10"
                >
                  <Printer className="h-4 w-4" />
                  <span className="ml-1 text-xs">KOT</span>
                </Button>
              </div>

              {/* Primary Action Button */}
              {(order.paymentStatus === "UNPAID" ||
                order.paymentStatus === "PARTIAL") && (
                <Button size="lg" onClick={onPay} className="w-full h-12">
                  <CreditCard className="mr-2 h-5 w-5" /> Proceed to Payment
                </Button>
              )}
              {order.status === "COMPLETED" &&
                order.paymentStatus === "PAID" &&
                (user?.role === "admin" || user?.role === "manager") && (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={onRefund}
                    className="w-full h-12"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" /> Refund Order
                  </Button>
                )}
            </div>
          </div>
        )}
        {/* Hidden receipt containers for printing */}
        <div style={{ display: "none" }}>
          <BillReceipt order={order} ref={billReceiptRef} />
        </div>
        <div style={{ display: "none" }}>
          <KOTReceipt order={order} ref={kotReceiptRef} />
        </div>
      </>
    );
  }
);

OrderDetail.displayName = "OrderDetail";
