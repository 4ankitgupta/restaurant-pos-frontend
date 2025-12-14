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
  ChevronUp,
  ChevronDown,
  Star,
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

  const handleMoveCategoryUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index - 1],
    ];
    setCategories(newOrder);
    try {
      await apiService.reorderCategories(newOrder.map((c) => c.id));
      toast({ title: "Success", description: "Category order updated" });
    } catch (error) {
      console.error("Failed to reorder categories:", error);
      fetchData(); // Revert on error
    }
  };

  const handleMoveCategoryDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [
      newOrder[index + 1],
      newOrder[index],
    ];
    setCategories(newOrder);
    try {
      await apiService.reorderCategories(newOrder.map((c) => c.id));
      toast({ title: "Success", description: "Category order updated" });
    } catch (error) {
      console.error("Failed to reorder categories:", error);
      fetchData(); // Revert on error
    }
  };

  const handleMoveItemUp = async (index: number) => {
    if (index === 0) return;

    const item1Id = filteredItems[index - 1].id;
    const item2Id = filteredItems[index].id;

    // Create new array with swapped items
    const newMenuItems = menuItems.map((item) => {
      if (item.id === item1Id) return { ...filteredItems[index] };
      if (item.id === item2Id) return { ...filteredItems[index - 1] };
      return item;
    });

    setMenuItems(newMenuItems);

    // Get the new order for the filtered category
    const reorderedFilteredItems = [...filteredItems];
    [reorderedFilteredItems[index - 1], reorderedFilteredItems[index]] = [
      reorderedFilteredItems[index],
      reorderedFilteredItems[index - 1],
    ];

    try {
      await apiService.reorderMenuItems(
        reorderedFilteredItems.map((i) => i.id)
      );
      toast({ title: "Success", description: "Item order updated" });
    } catch (error) {
      console.error("Failed to reorder items:", error);
      fetchData();
    }
  };

  const handleMoveItemDown = async (index: number) => {
    if (index === filteredItems.length - 1) return;

    const item1Id = filteredItems[index].id;
    const item2Id = filteredItems[index + 1].id;

    // Create new array with swapped items
    const newMenuItems = menuItems.map((item) => {
      if (item.id === item1Id) return { ...filteredItems[index + 1] };
      if (item.id === item2Id) return { ...filteredItems[index] };
      return item;
    });

    setMenuItems(newMenuItems);

    // Get the new order for the filtered category
    const reorderedFilteredItems = [...filteredItems];
    [reorderedFilteredItems[index], reorderedFilteredItems[index + 1]] = [
      reorderedFilteredItems[index + 1],
      reorderedFilteredItems[index],
    ];

    try {
      await apiService.reorderMenuItems(
        reorderedFilteredItems.map((i) => i.id)
      );
      toast({ title: "Success", description: "Item order updated" });
    } catch (error) {
      console.error("Failed to reorder items:", error);
      fetchData();
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Menu Management</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCategoryFormOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Tag className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Category</span>
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
            <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="whitespace-nowrap flex-shrink-0"
              >
                All Items ({menuItems.length})
              </Button>
              {categories.map((category, index) => {
                const itemCount = menuItems.filter(
                  (item) => item.categoryId === category.id
                ).length;
                return (
                  <div
                    key={category.id}
                    className="flex items-center rounded-md ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 flex-shrink-0"
                  >
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1 py-0"
                        onClick={() => handleMoveCategoryUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1 py-0"
                        onClick={() => handleMoveCategoryDown(index)}
                        disabled={index === categories.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant={
                        selectedCategory === category.id ? "default" : "outline"
                      }
                      size="sm"
                      className="rounded-r-none whitespace-nowrap"
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
                              <AlertDialogTitle>
                                Delete Category
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {getLocalizedName(category, language)}"? This
                                will affect all menu items in this category.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
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
      </div>

      {/* Menu Items Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <Card key={item.id} className="relative flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1 py-0"
                        onClick={() => handleMoveItemUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1 py-0"
                        onClick={() => handleMoveItemDown(index)}
                        disabled={index === filteredItems.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1">
                      {item.isFavorite && (
                        <Star className="h-4 w-4 inline-block mr-1 text-yellow-500 fill-yellow-500" />
                      )}
                      {getLocalizedName(item, language)}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditItem(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
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
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryName(item.categoryId)}
                  </Badge>
                  <Badge
                    variant={item.isAvailable ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-2">
                  {item.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {getLocalizedText(item, "description", language)}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-col w-full">
                      {item.variants.length === 1 ? (
                        <span className="text-base sm:text-lg font-bold text-primary">
                          ₹{parseFloat(item.variants[0].price).toFixed(2)}
                        </span>
                      ) : (
                        <div className="text-xs sm:text-sm w-full">
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
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                No Menu Items
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedCategory === "all"
                  ? "No menu items found. Add some items to get started."
                  : "No items in this category. Try selecting a different category."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Menu;
