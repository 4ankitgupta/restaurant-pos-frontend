import React, { useState, useEffect } from "react";
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

interface StockAdjustmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  items: InventoryItem[];
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  items,
}) => {
  const { loading, execute } = useApi();
  const [selectedItemId, setSelectedItemId] = useState("");
  const [changeType, setChangeType] = useState<StockChangeType>("USAGE");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedItemId("");
      setChangeType("USAGE");
      setQuantity("");
      setRemarks("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast({
        title: "Error",
        description: "Please select an item.",
        variant: "destructive",
      });
      return;
    }

    try {
      await execute(() =>
        apiService.adjustStock({
          inventoryItemId: selectedItemId,
          changeType,
          quantity: parseFloat(quantity),
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
            <Select onValueChange={setSelectedItemId} value={selectedItemId}>
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
                <SelectItem value="ADD">Add Stock (Correction)</SelectItem>
                <SelectItem value="USAGE">Usage</SelectItem>
                <SelectItem value="WASTAGE">Wastage</SelectItem>
                <SelectItem value="ADJUST">Manual Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter a positive number. 'Usage' and 'Wastage' will automatically
              deduct from stock.
            </p>
          </div>

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
