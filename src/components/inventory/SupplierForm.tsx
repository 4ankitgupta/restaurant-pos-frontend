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
import { Supplier } from "@/types/restaurant";

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingSupplier: Supplier | null;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editingSupplier,
}) => {
  const { loading, execute } = useApi();
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (editingSupplier) {
      setForm({
        name: editingSupplier.name,
        contactPerson: editingSupplier.contactPerson || "",
        phone: editingSupplier.phone || "",
        email: editingSupplier.email || "",
        address: editingSupplier.address || "",
      });
    } else {
      setForm({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [editingSupplier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await execute(() =>
          apiService.updateSupplier(editingSupplier.id, form)
        );
        toast({ title: "Success", description: "Supplier updated." });
      } else {
        await execute(() => apiService.createSupplier(form));
        toast({ title: "Success", description: "Supplier created." });
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to save supplier:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the supplier.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields for name, contactPerson, phone, email, address */}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Supplier"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
