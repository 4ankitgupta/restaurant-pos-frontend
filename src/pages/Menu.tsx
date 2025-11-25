import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Utensils,
  Tag,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { APIMenuItem } from "@/types/restaurant";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedName, getLocalizedText } from "@/lib/utils";
import { MenuCategoryForm } from "../components/menu/MenuCategoryForm";
import { MenuItemForm } from "../components/menu/MenuItemForm";

import { useRefresh } from "@/contexts/RefreshContext";

interface MenuCategory {
  id: string;
  name: string;
  nameHindi?: string;
  description: string | null;
  restaurantId: string;
}

const Menu: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<APIMenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(
    null
  );

  const { loading: categoriesLoading, execute: executeCategories } = useApi<{
    data: MenuCategory[];
  }>();
  const { loading: itemsLoading, execute: executeItems } = useApi<{
    data: APIMenuItem[];
  }>();
  const { loading: deleteLoading, execute: executeDelete } = useApi();
  const { refreshKey } = useRefresh();
  const { language } = useLanguage();

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        executeCategories(() => apiService.getMenuCategories()),
        executeItems(() => apiService.getMenuItems()),
      ]);

      if (categoriesRes) setCategories(categoriesRes.data);
      if (itemsRes) setMenuItems(Array.isArray(itemsRes) ? itemsRes : []);
    } catch (error) {
      console.error("Failed to fetch menu data:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await executeDelete(() => apiService.deleteMenuItem(itemId));
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to delete menu item:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await executeDelete(() => apiService.deleteCategory(categoryId));
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchData();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const startEditItem = (item: APIMenuItem) => {
    setEditingItem(item);
    setIsItemFormOpen(true);
  };

  const startEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };

  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.categoryId === selectedCategory);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return "Unknown Category";
    return getLocalizedName(category, language);
  };

  const loading = categoriesLoading || itemsLoading || deleteLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsCategoryFormOpen(true)}>
            <Tag className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          {/* <Button onClick={() => setIsItemFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </Button> */}

          <MenuCategoryForm
            open={isCategoryFormOpen}
            onOpenChange={(open) => {
              if (!open) setEditingCategory(null);
              setIsCategoryFormOpen(open);
            }}
            onSuccess={fetchData}
            editingCategory={editingCategory}
          />
          <MenuItemForm
            open={isItemFormOpen}
            onOpenChange={(open) => {
              if (!open) setEditingItem(null);
              setIsItemFormOpen(open);
            }}
            onSuccess={fetchData}
            categories={categories}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
          />
        </div>
      </div>

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Items ({menuItems.length})
            </Button>
            {categories.map((category) => {
              const itemCount = menuItems.filter(
                (item) => item.categoryId === category.id
              ).length;
              return (
                <div
                  key={category.id}
                  className="flex items-center rounded-md ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                >
                  <Button
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {getLocalizedName(category, language)} ({itemCount})
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={
                          selectedCategory === category.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="px-2 rounded-l-none border-l"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => startEditCategory(category)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "
                              {getLocalizedName(category, language)}"? This will
                              affect all menu items in this category.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  {getLocalizedName(item, language)}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditItem(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{item.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {getCategoryName(item.categoryId)}
                </Badge>
                <Badge variant={item.isAvailable ? "default" : "destructive"}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {getLocalizedText(item, "description", language)}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-col">
                    {item.variants.length === 1 ? (
                      <span className="text-lg font-bold text-primary">
                        ₹{parseFloat(item.variants[0].price).toFixed(2)}
                      </span>
                    ) : (
                      <div className="text-sm">
                        {item.variants.map((v) => (
                          <div key={v.id} className="">
                            <span className="font-medium">
                              {getLocalizedName(v as any, language)}:
                            </span>{" "}
                            <span className="font-bold">
                              ₹{parseFloat(v.price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Menu Items</h3>
            <p className="text-muted-foreground">
              {selectedCategory === "all"
                ? "No menu items found. Add some items to get started."
                : "No items in this category. Try selecting a different category."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Menu;
