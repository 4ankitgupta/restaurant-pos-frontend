import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { InventoryItem, StockChangeType } from "@/types/restaurant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface StockAdjustmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  items: InventoryItem[];
}

const formatStockDate = (dateString?: string) => {
  if (!dateString) return "Not available";
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Failed to format date:", error);
    return "Invalid date";
  }
};

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  items,
}) => {
  const { loading, execute } = useApi();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [changeType, setChangeType] = useState<StockChangeType>("USAGE");
  const [remarks, setRemarks] = useState("");

  const [adjustmentMode, setAdjustmentMode] = useState<
    "currentStock" | "quantity"
  >("currentStock");
  const [newStock, setNewStock] = useState("");
  const [difference, setDifference] = useState("");
  const [isAddition, setIsAddition] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedItem(null);
      setChangeType("USAGE");
      setRemarks("");
      setAdjustmentMode("currentStock");
      setNewStock("");
      setDifference("");
      setIsAddition(false);
    }
  }, [open]);

  useEffect(() => {
    // Automatically set addition/subtraction based on change type, unless it's ADJUST
    if (changeType === "ADD") {
      setIsAddition(true);
    } else if (["USAGE", "WASTAGE"].includes(changeType)) {
      setIsAddition(false);
    }
  }, [changeType]);

  const { calculatedDifference, stockAfterUpdate } = useMemo(() => {
    const current = selectedItem?.currentStock ?? 0;
    let diff = 0;
    let afterUpdate = current;

    if (adjustmentMode === "currentStock") {
      const newStockValue = parseFloat(newStock);
      if (!isNaN(newStockValue)) {
        diff = newStockValue - current;
        afterUpdate = newStockValue;
      }
    } else {
      const diffValue = parseFloat(difference);
      if (!isNaN(diffValue)) {
        diff = isAddition ? diffValue : -diffValue;
        afterUpdate = current + diff;
      }
    }
    return { calculatedDifference: diff, stockAfterUpdate: afterUpdate };
  }, [selectedItem, adjustmentMode, newStock, difference, isAddition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Please select an item.",
        variant: "destructive",
      });
      return;
    }

    let finalQuantity: number;
    let finalChangeType: StockChangeType = changeType;

    if (adjustmentMode === "currentStock") {
      finalChangeType = "ADJUST";
      finalQuantity = parseFloat(newStock);
      if (isNaN(finalQuantity) || finalQuantity < 0) {
        toast({
          title: "Invalid Input",
          description: "Current stock must be a non-negative number.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // 'quantity' mode
      const diffQty = parseFloat(difference);
      if (isNaN(diffQty) || diffQty <= 0) {
        toast({
          title: "Invalid Input",
          description: "Quantity must be a positive number.",
          variant: "destructive",
        });
        return;
      }

      if (changeType === "ADJUST") {
        if (!isAddition && diffQty > selectedItem.currentStock) {
          toast({
            title: "Invalid Quantity",
            description: "Cannot remove more stock than available.",
            variant: "destructive",
          });
          return;
        }
        finalQuantity = isAddition
          ? selectedItem.currentStock + diffQty
          : selectedItem.currentStock - diffQty;
      } else {
        finalQuantity = diffQty;
        if (!isAddition && finalQuantity > selectedItem.currentStock) {
          toast({
            title: "Invalid Quantity",
            description: "Cannot remove more stock than available.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    try {
      await execute(() =>
        apiService.adjustStock({
          inventoryItemId: selectedItem.id,
          changeType: finalChangeType,
          quantity: finalQuantity,
          remarks,
        })
      );
      toast({ title: "Success", description: "Stock adjusted successfully." });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to adjust stock:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock Quantity</DialogTitle>
          <DialogDescription>
            Select an item and specify the adjustment details. This is for daily
            updates like wastage or usage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item-select">Inventory Item</Label>
            <Select
              onValueChange={(id) => {
                const item = items.find((item) => item.id === id);
                if (item) setSelectedItem(item);
              }}
              value={selectedItem?.id || ""}
            >
              <SelectTrigger id="item-select">
                <SelectValue placeholder="Select an item..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem?.id && (
            <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
              Available Stock:{" "}
              <span className="font-semibold text-foreground">
                {selectedItem.currentStock} {selectedItem.unit}
              </span>
              <span className="text-xs">
                {" "}
                (as of {formatStockDate(selectedItem.lastUpdated)})
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Label>Set Current Stock</Label>
            <Switch
              checked={adjustmentMode === "quantity"}
              onCheckedChange={(checked) =>
                setAdjustmentMode(checked ? "quantity" : "currentStock")
              }
            />
            <Label>Adjust by Quantity</Label>
          </div>

          <div>
            <Label htmlFor="change-type">Reason for Change</Label>
            <Select
              onValueChange={(value) => setChangeType(value as StockChangeType)}
              value={changeType}
            >
              <SelectTrigger id="change-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADD">
                  Add Stock (Purchase/Correction)
                </SelectItem>
                <SelectItem value="USAGE">Usage</SelectItem>
                <SelectItem value="WASTAGE">Wastage</SelectItem>
                <SelectItem value="ADJUST">Manual Count Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {adjustmentMode === "currentStock" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-stock">New Current Stock</Label>
                <Input
                  id="new-stock"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="diff-view">Difference</Label>
                <Input
                  id="diff-view"
                  value={calculatedDifference.toFixed(2)}
                  disabled
                />
              </div>
            </div>
          )}

          {adjustmentMode === "quantity" && (
            <div className="space-y-4">
              {changeType === "ADJUST" && (
                <div className="flex items-center space-x-2">
                  <Label>Subtraction</Label>
                  <Switch
                    checked={isAddition}
                    onCheckedChange={setIsAddition}
                  />
                  <Label>Addition</Label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    max={
                      !isAddition && selectedItem
                        ? selectedItem.currentStock
                        : undefined
                    }
                    value={difference}
                    onChange={(e) => setDifference(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="after-update">Stock After Update</Label>
                  <Input
                    id="after-update"
                    value={stockAfterUpdate.toFixed(2)}
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., End of day stock count"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Adjust Stock"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
