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
  const [showAllCategories, setShowAllCategories] = useState(false);

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
      fetchData();
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
      fetchData();
    }
  };

  const handleMoveItemUp = async (index: number) => {
    if (index === 0) return;

    const item1Id = filteredItems[index - 1].id;
    const item2Id = filteredItems[index].id;

    const newMenuItems = menuItems.map((item) => {
      if (item.id === item1Id) return { ...filteredItems[index] };
      if (item.id === item2Id) return { ...filteredItems[index - 1] };
      return item;
    });

    setMenuItems(newMenuItems);

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

    const newMenuItems = menuItems.map((item) => {
      if (item.id === item1Id) return { ...filteredItems[index + 1] };
      if (item.id === item2Id) return { ...filteredItems[index] };
      return item;
    });

    setMenuItems(newMenuItems);

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
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 p-4 sm:p-6 space-y-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Utensils className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Menu Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your menu items and categories
            </p>
          </div>
          <Button
            onClick={() => setIsCategoryFormOpen(true)}
            className="w-full sm:w-auto"
            size="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>

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

        {/* Categories Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Filter by Category</CardTitle>
              </div>
              {categories.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {categories.length}{" "}
                  {categories.length === 1 ? "category" : "categories"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-6">
                <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-3">
                  No categories yet. Create your first category to organize menu
                  items.
                </p>
                <Button
                  onClick={() => setIsCategoryFormOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={`flex flex-wrap gap-2 transition-all duration-300 ${
                    !showAllCategories && categories.length > 4
                      ? "max-h-[80px] overflow-hidden"
                      : ""
                  }`}
                >
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                    className="whitespace-nowrap font-medium"
                  >
                    <Utensils className="h-3.5 w-3.5 mr-1.5" />
                    All Items ({menuItems.length})
                  </Button>
                  {categories.map((category, index) => {
                    const itemCount = menuItems.filter(
                      (item) => item.categoryId === category.id
                    ).length;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <div
                        key={category.id}
                        className={`group flex items-center rounded-lg transition-all ${
                          isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                        }`}
                      >
                        <div className="flex flex-col bg-background rounded-l-lg border-y border-l">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 px-1 py-0 hover:bg-primary/10 rounded-none"
                            onClick={() => handleMoveCategoryUp(index)}
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 px-1 py-0 hover:bg-primary/10 rounded-none"
                            onClick={() => handleMoveCategoryDown(index)}
                            disabled={index === categories.length - 1}
                            title="Move down"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="rounded-none whitespace-nowrap font-medium px-3"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {getLocalizedName(category, language)}
                          <Badge
                            variant={isSelected ? "secondary" : "outline"}
                            className="ml-2 text-xs"
                          >
                            {itemCount}
                          </Badge>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="px-2 rounded-l-none border-l"
                              title="More options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => startEditCategory(category)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Category</span>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Category</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Category?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    <strong>
                                      {getLocalizedName(category, language)}
                                    </strong>
                                    "? This will affect {itemCount} menu{" "}
                                    {itemCount === 1 ? "item" : "items"} in this
                                    category.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteCategory(category.id)
                                    }
                                    className="bg-destructive hover:bg-destructive/90"
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
                {categories.length > 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="w-full"
                  >
                    {showAllCategories ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less Categories
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        View More Categories
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Menu Items Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {selectedCategory === "all"
                ? "All Menu Items"
                : getCategoryName(selectedCategory)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"} found
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <Card
              key={item.id}
              className="relative flex flex-col hover:shadow-md transition-shadow group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-primary/10"
                        onClick={() => handleMoveItemUp(index)}
                        disabled={index === 0}
                        title="Move item up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-primary/10"
                        onClick={() => handleMoveItemDown(index)}
                        disabled={index === filteredItems.length - 1}
                        title="Move item down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg line-clamp-2 flex items-start gap-1.5">
                        {item.isFavorite && (
                          <Star className="h-4 w-4 flex-shrink-0 mt-0.5 text-yellow-500 fill-yellow-500" />
                        )}
                        <span className="break-words">
                          {getLocalizedName(item, language)}
                        </span>
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditItem(item)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      title="Edit item"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "
                            <strong>{getLocalizedName(item, language)}</strong>
                            "? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteItem(item.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    <Tag className="h-3 w-3 mr-1" />
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

              <CardContent className="flex-1 pt-0">
                <div className="space-y-3">
                  {item.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {getLocalizedText(item, "description", language)}
                    </p>
                  )}
                  <div className="pt-2 border-t">
                    {item.variants.length === 1 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Price
                        </span>
                        <span className="text-lg font-bold text-primary">
                          ₹{parseFloat(item.variants[0].price).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <span className="text-sm font-medium text-muted-foreground">
                          Variants
                        </span>
                        {item.variants.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {getLocalizedName(v as any, language)}
                            </span>
                            <span className="font-bold text-primary">
                              ₹{parseFloat(v.price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && !loading && (
          <Card className="border-dashed">
            <CardContent className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Utensils className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {selectedCategory === "all"
                  ? "No Menu Items Yet"
                  : "No Items in This Category"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {selectedCategory === "all"
                  ? "Get started by creating your first menu item. Add delicious dishes for your customers to order."
                  : `There are no items in "${getCategoryName(
                      selectedCategory
                    )}" yet. Try selecting a different category or add items here.`}
              </p>
              {selectedCategory !== "all" && (
                <Button
                  onClick={() => setSelectedCategory("all")}
                  variant="outline"
                  size="sm"
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  View All Items
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="flex gap-2">
                    <div className="h-5 bg-muted rounded w-20"></div>
                    <div className="h-5 bg-muted rounded w-16"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
