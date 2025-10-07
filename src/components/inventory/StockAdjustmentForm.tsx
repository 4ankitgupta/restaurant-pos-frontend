import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface StockAdjustmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item: InventoryItem | null;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  item,
}) => {
  const { loading, execute } = useApi();
  const [changeType, setChangeType] = useState<StockChangeType>("ADJUST");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open) {
      setChangeType("ADJUST");
      setQuantity("");
      setRemarks("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    try {
      await execute(() =>
        apiService.adjustStock({
          inventoryItemId: item.id,
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
          <DialogTitle>Adjust Stock for {item?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields for changeType, quantity, remarks */}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Adjust Stock"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
