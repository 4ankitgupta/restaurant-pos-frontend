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
  DialogFooter,
  DialogClose,
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  inventoryItems: InventoryItem[];
  suppliers: Supplier[];
}

type POItem = { inventoryItemId: string; quantity: string; unitPrice: string };

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
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [items, setItems] = useState<POItem[]>([
    { inventoryItemId: "", quantity: "", unitPrice: "" },
  ]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setSupplierId("");
      setInvoiceNumber("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setItems([{ inventoryItemId: "", quantity: "", unitPrice: "" }]);
    }
  }, [open]);

  const handleAddItem = () => {
    setItems([...items, { inventoryItemId: "", quantity: "", unitPrice: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof POItem,
    value: string
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
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
    if (
      !supplierId ||
      items.some(
        (item) => !item.inventoryItemId || !item.quantity || !item.unitPrice
      )
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields for supplier and items.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      supplierId,
      invoiceNumber,
      purchaseDate: new Date(purchaseDate).toISOString(),
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
      toast({
        title: "Error",
        description: "Failed to create purchase order.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Record a new purchase from a supplier to update your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={supplierId}
                    onValueChange={setSupplierId}
                    required
                  >
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">
                    Invoice Number (Optional)
                  </Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
              </div>

              <Label>Items</Label>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end"
                  >
                    <div className="col-span-5 space-y-1">
                      {index === 0 && (
                        <Label className="text-xs">Inventory Item</Label>
                      )}
                      <Select
                        value={item.inventoryItemId}
                        onValueChange={(value) =>
                          handleItemChange(index, "inventoryItemId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((invItem) => (
                            <SelectItem key={invItem.id} value={invItem.id}>
                              {invItem.name} ({invItem.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      {index === 0 && (
                        <Label className="text-xs">Quantity</Label>
                      )}
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {index === 0 && (
                        <Label className="text-xs">Unit Price</Label>
                      )}
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", e.target.value)
                        }
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {index === 0 && <Label className="text-xs">Total</Label>}
                      <Input
                        value={(
                          (parseFloat(item.quantity) || 0) *
                          (parseFloat(item.unitPrice) || 0)
                        ).toFixed(2)}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t mt-4">
            <div className="flex-1 text-lg font-bold">
              Total: ₹{calculateTotal().toFixed(2)}
            </div>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Purchase Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
