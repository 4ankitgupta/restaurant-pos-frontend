// src/components/inventory/InventoryItemForm.tsx
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
import { InventoryItem } from "@/types/restaurant";

interface InventoryItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingItem: InventoryItem | null;
}

export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editingItem,
}) => {
  const { loading: createLoading, execute: executeCreate } = useApi();
  const { loading: updateLoading, execute: executeUpdate } = useApi();

  const [form, setForm] = useState({
    name: "",
    unit: "",
    reorderLevel: "0",
  });

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        unit: editingItem.unit,
        reorderLevel: String(editingItem.reorderLevel),
      });
    } else {
      setForm({
        name: "",
        unit: "",
        reorderLevel: "0",
      });
    }
  }, [editingItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemData = {
      name: form.name,
      unit: form.unit,
      reorderLevel: parseFloat(form.reorderLevel),
    };

    try {
      if (editingItem) {
        await executeUpdate(() =>
          apiService.updateInventoryItem(editingItem.id, itemData)
        );
        toast({
          title: "Success",
          description: "Inventory item updated successfully",
        });
      } else {
        await executeCreate(() =>
          apiService.createInventoryItem({ ...itemData, currentStock: 0 })
        );
        toast({
          title: "Success",
          description: "Inventory item created successfully",
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to save inventory item:", error);
    }
  };

  const isLoading = createLoading || updateLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Item" : "Add New Item"}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? "Update the details for this inventory item."
              : "Fill in the form to add a new item to your inventory."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              id="item-name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="item-unit">Unit</Label>
            <Input
              id="item-unit"
              value={form.unit}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, unit: e.target.value }))
              }
              placeholder="e.g., kg, pieces, liters"
              required
            />
          </div>
          <div>
            <Label htmlFor="item-reorder">Re-order Level</Label>
            <Input
              id="item-reorder"
              type="number"
              step="0.01"
              value={form.reorderLevel}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reorderLevel: e.target.value }))
              }
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading
              ? "Saving..."
              : editingItem
              ? "Update Item"
              : "Create Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
