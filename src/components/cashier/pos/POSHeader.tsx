import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, ShoppingCart, Utensils, LayoutGrid } from "lucide-react";
import { APIOrder } from "@/types/restaurant";
import { OrderList } from "../OrderList";
import { useIsMobile } from "@/hooks/use-mobile";

type ServiceType = "DINE_IN" | "TAKEAWAY";

interface POSHeaderProps {
  serviceType: ServiceType;
  onServiceTypeChange: (type: ServiceType) => void;
  selectedTable: { tableNumber: string } | null;
  currentOrder: APIOrder | null;
  completedOrders: APIOrder[];
  activeTakeawayOrders: APIOrder[];
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  activeTakeawayOpen: boolean;
  setActiveTakeawayOpen: (open: boolean) => void;
  onSelectHistoryOrder: (order: APIOrder) => void;
  onSelectActiveTakeaway: (order: APIOrder) => void;
  selectedHistoryOrderId?: string;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  serviceType,
  onServiceTypeChange,
  selectedTable,
  currentOrder,
  completedOrders,
  activeTakeawayOrders,
  historyOpen,
  setHistoryOpen,
  activeTakeawayOpen,
  setActiveTakeawayOpen,
  onSelectHistoryOrder,
  onSelectActiveTakeaway,
  selectedHistoryOrderId,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between gap-2 md:gap-3">
      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
        <h1 className="text-lg md:text-2xl font-bold">Cashier Station</h1>
        <Badge variant="secondary" className="uppercase text-xs md:text-sm">
          POS
        </Badge>
        {serviceType === "DINE_IN" && selectedTable && (
          <Badge className="text-xs md:text-sm">
            Table {selectedTable.tableNumber}
          </Badge>
        )}
        {currentOrder && !isMobile && (
          <Badge variant="outline" className="text-xs md:text-sm">
            Order #{currentOrder.id.slice(0, 6)}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {serviceType === "TAKEAWAY" && activeTakeawayOrders.length > 0 && (
          <Sheet open={activeTakeawayOpen} onOpenChange={setActiveTakeawayOpen}>
            <SheetTrigger asChild>
              <Button variant="default" size={isMobile ? "sm" : "sm"}>
                <ShoppingCart className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">
                  Active ({activeTakeawayOrders.length})
                </span>
                <span className="md:hidden">
                  ({activeTakeawayOrders.length})
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Active Takeaway Orders</SheetTitle>
                <SheetDescription>
                  View and manage active takeaway orders
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 h-[calc(100vh-200px)]">
                <OrderList
                  orders={activeTakeawayOrders}
                  title="Active Takeaway Orders"
                  onSelectOrder={onSelectActiveTakeaway}
                  selectedOrderId={currentOrder?.id}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}

        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size={isMobile ? "sm" : "sm"}>
              <History className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">
                History ({completedOrders.length})
              </span>
              <span className="md:hidden">({completedOrders.length})</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Completed Orders Today</SheetTitle>
              <SheetDescription>
                View all completed orders from today
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 h-[calc(100vh-200px)]">
              <OrderList
                orders={completedOrders}
                title="Completed Orders"
                onSelectOrder={onSelectHistoryOrder}
                selectedOrderId={selectedHistoryOrderId}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Tabs
          value={serviceType}
          onValueChange={(v) => onServiceTypeChange(v as ServiceType)}
        >
          <TabsList className="h-9">
            <TabsTrigger value="DINE_IN" className="text-xs md:text-sm">
              <Utensils className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
              <span className="hidden md:inline">Dine-In</span>
            </TabsTrigger>
            <TabsTrigger value="TAKEAWAY" className="text-xs md:text-sm">
              <LayoutGrid className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
              <span className="hidden md:inline">Takeaway</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
