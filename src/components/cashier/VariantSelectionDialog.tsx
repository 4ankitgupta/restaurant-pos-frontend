import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { APIMenuItem } from "@/types/restaurant";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface VariantSelectionDialogProps {
  item: APIMenuItem | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (variantId: string, note?: string) => void;
}

export const VariantSelectionDialog: React.FC<VariantSelectionDialogProps> = ({
  item,
  open,
  onOpenChange,
  onSelect,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!selectedVariantId) return;
    onSelect(selectedVariantId, note.trim() || undefined);
    onOpenChange(false);
    setSelectedVariantId("");
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Select Variant for {item?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {item && (
            <RadioGroup
              value={selectedVariantId}
              onValueChange={setSelectedVariantId}
            >
              {item.variants.map((variant) => (
                <div key={variant.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={variant.id} id={variant.id} />
                  <Label htmlFor={variant.id} className="flex-1">
                    {variant.name} - ₹{parseFloat(variant.price).toFixed(2)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          <div className="space-y-2">
            <Label htmlFor="note">Special Instructions (Optional)</Label>
            <Textarea
              id="note"
              placeholder="E.g., Extra spicy, No onions, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!selectedVariantId}>
            Add to Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
