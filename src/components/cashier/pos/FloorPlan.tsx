import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCw } from "lucide-react";
import { APITable } from "@/types/restaurant";

interface FloorPlanProps {
  tables: APITable[];
  onTableClick: (table: APITable) => void;
  onRefresh: () => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({
  tables,
  onTableClick,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-muted-foreground text-sm md:text-base">
          Select Table
        </h3>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 p-1">
          {tables.map((t) => (
            <button
              key={t.id}
              className={`rounded-lg p-3 md:p-4 border text-left transition-all active:scale-95 md:hover:scale-105 ${
                t.status === "Occupied"
                  ? "bg-red-50 border-red-200 text-red-700 shadow-sm"
                  : t.status === "Available"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                  : "bg-muted/20"
              }`}
              onClick={() => onTableClick(t)}
            >
              <div className="text-xs md:text-sm opacity-70">Table</div>
              <div className="text-xl md:text-2xl font-bold">
                {t.tableNumber}
              </div>
              <div className="mt-1 md:mt-2 flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    t.status === "Occupied" ? "bg-red-500" : "bg-emerald-500"
                  }`}
                ></span>
                <span className="text-[10px] md:text-xs font-medium">
                  {t.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
