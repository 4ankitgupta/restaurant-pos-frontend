import React, { useEffect, useState } from "react";
import { APITable } from "@/types/restaurant";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TableFormValues = {
  tableNumber: string;
  capacity: number;
  status: APITable["status"];
};

interface TableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TableFormValues) => Promise<void>;
  loading: boolean;
  editingTable: APITable | null;
  setEditingTable: (table: APITable | null) => void;
}

const STATUS_OPTIONS: APITable["status"][] = [
  "Available",
  "Reserved",
  "Occupied",
  "NeedCleaning",
];

export const TableForm: React.FC<TableFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
  editingTable,
  setEditingTable,
}) => {
  const [formValues, setFormValues] = useState({
    tableNumber: "",
    capacity: "",
    status: "Available" as APITable["status"],
  });

  useEffect(() => {
    if (editingTable) {
      setFormValues({
        tableNumber: editingTable.tableNumber,
        capacity: editingTable.capacity.toString(),
        status: editingTable.status,
      });
    } else {
      setFormValues({
        tableNumber: "",
        capacity: "",
        status: "Available",
      });
    }
  }, [editingTable, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: TableFormValues = {
      tableNumber: formValues.tableNumber.trim(),
      capacity: Number(formValues.capacity),
      status: formValues.status,
    };

    await onSubmit(payload);
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setEditingTable(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {editingTable ? "Edit Table" : "Add New Table"}
          </DialogTitle>
          <DialogDescription>
            {editingTable
              ? "Update table details and save your changes."
              : "Provide the details below to add a new table."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-number">Table Number</Label>
            <Input
              id="table-number"
              value={formValues.tableNumber}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  tableNumber: event.target.value,
                }))
              }
              placeholder="e.g. T12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              value={formValues.capacity}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  capacity: event.target.value,
                }))
              }
              placeholder="Number of guests"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formValues.status}
              onValueChange={(value) =>
                setFormValues((prev) => ({
                  ...prev,
                  status: value as APITable["status"],
                }))
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading
                ? editingTable
                  ? "Saving..."
                  : "Creating..."
                : editingTable
                ? "Save Changes"
                : "Create Table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
