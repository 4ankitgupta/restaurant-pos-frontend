import { useState } from "react";
import { APITable, APIOrder } from "@/types/restaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Users, Clock, CheckCircle, AlertCircle, BookOpen } from "lucide-react";

interface TableSheetProps {
  table: APITable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSeatCustomers: (partySize: number) => void;
  onTakeOrder: (tableId: string) => void;
  onUpdateStatus: (tableId: string, status: APITable["status"]) => void;
  orders: APIOrder[];
}

export function TableSheet({
  table,
  open,
  onOpenChange,
  onSeatCustomers,
  onTakeOrder,
  onUpdateStatus,
  orders,
}: TableSheetProps) {
  const [partySize, setPartySize] = useState("");

  if (!table) return null;

  const handleSeatCustomers = () => {
    if (partySize) {
      onSeatCustomers(parseInt(partySize));
      setPartySize("");
      onOpenChange(false);
    }
  };

  const getStatusColor = (status: APITable["status"]) => {
    switch (status) {
      case "Available":
        return "bg-success text-success-foreground";
      case "Occupied":
        return "bg-warning text-warning-foreground";
      case "Reserved":
        return "bg-secondary text-secondary-foreground";
      case "NeedCleaning":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const tableOrder = orders.find((order) => order.tableId === table.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Table {table.tableNumber}</SheetTitle>
          <SheetDescription>Capacity: {table.capacity} people</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Current Status */}
          <div>
            <h3 className="font-semibold mb-3">Current Status</h3>
            <Badge className={getStatusColor(table.status)}>
              {table.status}
            </Badge>
            {table.status === "Occupied" && table.orderStatus && (
              <div className="flex items-center gap-2 mt-2">
                <BookOpen className="h-4 w-4" />
                <Badge variant="outline">{table.orderStatus}</Badge>
              </div>
            )}
            {/* Removed payment status display per request */}
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="font-semibold mb-3">Quick Actions</h3>

            {table.status === "Available" && (
              <div className="space-y-3">
                <Input
                  placeholder="Party size"
                  type="number"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                />
                <Button
                  onClick={handleSeatCustomers}
                  disabled={!partySize}
                  className="w-full"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Seat Customers
                </Button>
              </div>
            )}

            {table.status === "Occupied" && (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    onTakeOrder(table.id);
                    onOpenChange(false);
                  }}
                  className="w-full bg-gradient-primary"
                  disabled={table.orderStatus === null}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Take / View Order
                </Button>
              </div>
            )}

            {table.status === "NeedCleaning" && (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    onUpdateStatus(table.id, "Available");
                    onOpenChange(false);
                  }}
                  className="w-full bg-success text-success-foreground"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Clean & Available
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              {table.status === "Occupied" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onUpdateStatus(table.id, "NeedCleaning");
                      onOpenChange(false);
                    }}
                    disabled={table.orderStatus === "IN_PROGRESS"}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Mark for Cleaning
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onUpdateStatus(table.id, "Available");
                      onOpenChange(false);
                    }}
                    disabled={table.orderStatus === "IN_PROGRESS"}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Clear Table
                  </Button>
                </>
              )}

              {table.status === "Available" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onUpdateStatus(table.id, "Reserved");
                    onOpenChange(false);
                  }}
                  className="col-span-2"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Mark as Reserved
                </Button>
              )}

              {table.status === "Reserved" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onUpdateStatus(table.id, "Available");
                    onOpenChange(false);
                  }}
                  className="col-span-2"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Cancel Reservation
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
