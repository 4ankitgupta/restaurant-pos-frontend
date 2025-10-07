import React, { useState } from "react";
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
import { InventoryItem, Supplier } from "@/types/restaurant";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  inventoryItems: InventoryItem[];
  suppliers: Supplier[];
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  inventoryItems,
  suppliers,
}) => {
  const { loading, execute } = useApi();
  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [items, setItems] = useState<
    { inventoryItemId: string; quantity: string; unitPrice: string }[]
  >([]);

  const handleAddItem = () => {
    setItems([...items, { inventoryItemId: "", quantity: "", unitPrice: "" }]);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce(
      (total, item) =>
        total +
        (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
      0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderData = {
      supplierId,
      invoiceNumber,
      totalAmount: calculateTotal(),
      items: items.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      })),
    };
    try {
      await execute(() => apiService.createPurchaseOrder(orderData));
      toast({
        title: "Success",
        description: "Purchase order created successfully.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create purchase order:", error);
    }
  };

  // Render a complex form with fields for supplier, invoice, and a dynamic list of items
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form implementation here */}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Order"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
