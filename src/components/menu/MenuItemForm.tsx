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
import { Plus } from "lucide-react";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { APIMenuItem } from "@/types/restaurant";

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
    price: "",
    categoryId: "",
    isAvailable: true,
  });
  const { loading: createLoading, execute: executeCreate } = useApi();
  const { loading: updateLoading, execute: executeUpdate } = useApi();

  useEffect(() => {
    if (editingItem) {
      setItemForm({
        name: editingItem.name,
        description: editingItem.description || "",
        price: editingItem.price.toString(),
        categoryId: editingItem.categoryId || "",
        isAvailable: editingItem.isAvailable,
      });
    } else {
      setItemForm({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        isAvailable: true,
      });
    }
  }, [editingItem]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await executeCreate(() =>
        apiService.createMenuItem({
          ...itemForm,
          price: parseFloat(itemForm.price),
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
          price: parseFloat(itemForm.price),
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
      price: "",
      categoryId: "",
      isAvailable: true,
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
          <div>
            <Label htmlFor="item-price">Price</Label>
            <Input
              id="item-price"
              type="number"
              step="0.01"
              value={itemForm.price}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, price: e.target.value }))
              }
              required
            />
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
