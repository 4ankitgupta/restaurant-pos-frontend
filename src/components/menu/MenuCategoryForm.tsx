import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface MenuCategory {
  id: string;
  name: string;
  nameHindi?: string;
  description: string | null;
}

interface MenuCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingCategory: MenuCategory | null;
}

export const MenuCategoryForm: React.FC<MenuCategoryFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editingCategory,
}) => {
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    nameHindi: "",
    description: "",
  });
  const { loading, execute } = useApi();

  useEffect(() => {
    if (editingCategory) {
      setCategoryForm({
        name: editingCategory.name,
        nameHindi: editingCategory.nameHindi || "",
        description: editingCategory.description || "",
      });
    } else {
      setCategoryForm({ name: "", nameHindi: "", description: "" });
    }
  }, [editingCategory, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await execute(() =>
          apiService.updateCategory(editingCategory.id, categoryForm)
        );
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await execute(() => apiService.createCategory(categoryForm));
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category-name">Name (English)</Label>
            <Input
              id="category-name"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="category-name-hindi">Name (Hindi)</Label>
            <Input
              id="category-name-hindi"
              value={categoryForm.nameHindi}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  nameHindi: e.target.value,
                }))
              }
              placeholder="e.g. शुरुआत"
            />
          </div>
          <div>
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <Button type="submit" disabled={loading}>
            {editingCategory ? "Update Category" : "Create Category"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
