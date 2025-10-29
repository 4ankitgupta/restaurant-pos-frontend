import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNote?: string;
  onSave: (note: string) => void;
  itemName: string;
}

export const EditNoteDialog: React.FC<EditNoteDialogProps> = ({
  open,
  onOpenChange,
  initialNote = "",
  onSave,
  itemName,
}) => {
  const [note, setNote] = useState(initialNote);

  const handleSubmit = () => {
    onSave(note.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Special Instructions for {itemName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Special Instructions</Label>
            <Textarea
              id="note"
              placeholder="E.g., Extra spicy, No onions, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
