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
    nameHindi: "",
    description: "",
    descriptionHindi: "",
    categoryId: "",
    isAvailable: true,
    variants: [{ name: "", nameHindi: "", price: "" }] as {
      name: string;
      nameHindi: string;
      price: string;
    }[],
  });
  const { loading: createLoading, execute: executeCreate } = useApi();
  const { loading: updateLoading, execute: executeUpdate } = useApi();

  useEffect(() => {
    if (editingItem) {
      setItemForm({
        name: editingItem.name,
        nameHindi: editingItem.nameHindi || "",
        description: editingItem.description || "",
        descriptionHindi: editingItem.descriptionHindi || "",
        categoryId: editingItem.categoryId || "",
        isAvailable: editingItem.isAvailable,
        variants: editingItem.variants.map((v) => ({
          name: v.name,
          nameHindi: v.nameHindi || "",
          price: v.price,
        })),
      });
    } else {
      setItemForm({
        name: "",
        nameHindi: "",
        description: "",
        descriptionHindi: "",
        categoryId: "",
        isAvailable: true,
        variants: [{ name: "", nameHindi: "", price: "" }],
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
      variants: [...prev.variants, { name: "", nameHindi: "", price: "" }],
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
            nameHindi: v.nameHindi || undefined,
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
            nameHindi: v.nameHindi || undefined,
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
      nameHindi: "",
      description: "",
      descriptionHindi: "",
      categoryId: "",
      isAvailable: true,
      variants: [{ name: "", nameHindi: "", price: "" }],
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
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          className="flex flex-col gap-4 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div>
              <Label htmlFor="item-name">Name (English)</Label>
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
              <Label htmlFor="item-name-hindi">Name (Hindi)</Label>
              <Input
                id="item-name-hindi"
                value={itemForm.nameHindi}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    nameHindi: e.target.value,
                  }))
                }
                placeholder="e.g. पनीर टिक्का"
              />
            </div>
            <div>
              <Label htmlFor="item-description">Description (English)</Label>
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
              <Label htmlFor="item-description-hindi">
                Description (Hindi)
              </Label>
              <Textarea
                id="item-description-hindi"
                value={itemForm.descriptionHindi}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    descriptionHindi: e.target.value,
                  }))
                }
                placeholder="e.g. मसालों में मैरीनेट किया हुआ और ग्रिल किया हुआ पनीर"
              />
            </div>
            <div className="space-y-2">
              <Label>Variants</Label>
              {itemForm.variants.map((variant, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-md">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="Variant name (e.g., Full)"
                        value={variant.name}
                        onChange={(e) =>
                          handleVariantChange(index, "name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Hindi name (e.g., फुल)"
                        value={variant.nameHindi}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "nameHindi",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="w-32">
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
                    </div>
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
          </div>
          <div className="flex-shrink-0 pt-4 border-t">
            <Button type="submit" disabled={loading} className="w-full">
              {editingItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
