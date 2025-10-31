import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { MenuItemVariant, APIMenuItem } from "@/types/restaurant";
import { useState } from "react";
import { Check, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VariantSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: APIMenuItem;
  onConfirm: (variantId: string, note?: string) => void;
}

export const VariantSelectionDialog: React.FC<VariantSelectionDialogProps> = ({
  open,
  onOpenChange,
  menuItem,
  onConfirm,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    menuItem.variants[0]?.id || ""
  );
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    if (selectedVariantId) {
      onConfirm(selectedVariantId, note || undefined);
      setNote("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{menuItem.name}</DialogTitle>
          {menuItem.description && (
            <p className="text-sm text-muted-foreground">{menuItem.description}</p>
          )}
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Variants Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Choose Size/Variant</Label>
              <RadioGroup
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
                className="gap-2"
              >
                {menuItem.variants.map((variant) => (
                  <label
                    key={variant.id}
                    htmlFor={variant.id}
                    className={cn(
                      "relative flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                      "hover:border-primary/50 hover:bg-accent/5",
                      selectedVariantId === variant.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <RadioGroupItem value={variant.id} id={variant.id} className="shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{variant.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        ₹{parseFloat(variant.price).toFixed(2)}
                      </span>
                      {selectedVariantId === variant.id && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Special Instructions */}
            <div className="space-y-3">
              <Label htmlFor="note" className="text-base font-semibold flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Special Instructions (Optional)
              </Label>
              <Textarea
                id="note"
                placeholder="e.g., extra spicy, no onions, less oil"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedVariantId}
            className="w-full sm:w-auto"
          >
            Add to Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
