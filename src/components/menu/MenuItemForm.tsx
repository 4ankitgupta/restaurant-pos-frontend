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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus } from "lucide-react";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { APIMenuItem, CreateMenuItemVariantDTO } from "@/types/restaurant";

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: { id: string; name: string }[];
  editingItem: APIMenuItem | null;
  setEditingItem: (item: APIMenuItem | null) => void;
}

export const MenuItemForm: React.FC<MenuItemFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  categories,
  editingItem,
  setEditingItem,
}) => {
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    isAvailable: true,
    variants: [{ name: "", price: "" }] as { name: string; price: string }[],
  });
  const { loading: createLoading, execute: executeCreate } = useApi();
  const { loading: updateLoading, execute: executeUpdate } = useApi();

  useEffect(() => {
    if (editingItem) {
      setItemForm({
        name: editingItem.name,
        description: editingItem.description || "",
        categoryId: editingItem.categoryId || "",
        isAvailable: editingItem.isAvailable,
        variants: editingItem.variants.map((v) => ({
          name: v.name,
          price: v.price,
        })),
      });
    } else {
      setItemForm({
        name: "",
        description: "",
        categoryId: "",
        isAvailable: true,
        variants: [{ name: "", price: "" }],
      });
    }
  }, [editingItem]);

  const handleVariantChange = (
    index: number,
    field: keyof CreateMenuItemVariantDTO,
    value: string
  ) => {
    setItemForm((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = {
        ...newVariants[index],
        [field]: value,
      };
      return {
        ...prev,
        variants: newVariants,
      };
    });
  };

  const addVariant = () => {
    setItemForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: "", price: "" }],
    }));
  };

  const removeVariant = (index: number) => {
    if (itemForm.variants.length <= 1) return; // Keep at least one variant
    setItemForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await executeCreate(() =>
        apiService.createMenuItem({
          ...itemForm,
          variants: itemForm.variants.map((v) => ({
            name: v.name,
            price: parseFloat(v.price),
          })),
        })
      );
      toast({
        title: "Success",
        description: "Menu item created successfully",
      });
      resetFormAndClose();
      onSuccess();
    } catch (error) {
      console.error("Failed to create menu item:", error);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await executeUpdate(() =>
        apiService.updateMenuItem(editingItem.id, {
          ...itemForm,
          variants: itemForm.variants.map((v) => ({
            name: v.name,
            price: parseFloat(v.price),
          })),
        })
      );
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
      resetFormAndClose();
      onSuccess();
    } catch (error) {
      console.error("Failed to update menu item:", error);
    }
  };

  const resetFormAndClose = () => {
    setItemForm({
      name: "",
      description: "",
      categoryId: "",
      isAvailable: true,
      variants: [{ name: "", price: "" }],
    });
    setEditingItem(null);
    onOpenChange(false);
  };

  const loading = createLoading || updateLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setEditingItem(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={itemForm.name}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              value={itemForm.description}
              onChange={(e) =>
                setItemForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Variants</Label>
            {itemForm.variants.map((variant, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Variant name (e.g., Full)"
                  value={variant.name}
                  onChange={(e) =>
                    handleVariantChange(index, "name", e.target.value)
                  }
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(e) =>
                    handleVariantChange(index, "price", e.target.value)
                  }
                  required
                />
                {itemForm.variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addVariant}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>
          <div>
            <Label htmlFor="item-category">Category</Label>
            <Select
              value={itemForm.categoryId}
              onValueChange={(value) =>
                setItemForm((prev) => ({ ...prev, categoryId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {editingItem ? "Update Item" : "Create Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
