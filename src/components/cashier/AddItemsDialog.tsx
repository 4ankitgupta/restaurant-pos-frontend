import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { APIMenuItem } from "@/types/restaurant";
import { useState, useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Plus, Minus, ShoppingCart, MessageSquare, Star } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";
import { VariantSelectionDialog } from "./VariantSelectionDialog";
import { EditNoteDialog } from "./EditNoteDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedName } from "@/lib/utils";

interface MenuCategory {
  id: string;
  name: string;
  nameHindi?: string;
}

interface CartItem {
  variantId: string;
  quantity: number;
  note?: string;
  menuItemId: string; // Keep track of parent menu item
}

interface AddItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItems: APIMenuItem[];
  categories: MenuCategory[];
  onSubmit: (
    items: { menuItemVariantId: string; quantity: number; note?: string }[]
  ) => void;
  isLoading: boolean;
}

export const AddItemsDialog: React.FC<AddItemsDialogProps> = ({
  open,
  onOpenChange,
  menuItems,
  categories,
  onSubmit,
  isLoading,
}) => {
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("favorites");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const { language } = useLanguage();

  const handleItemClick = (menuItem: APIMenuItem) => {
    // If there's no variant, inform user (cannot add without a variant id)
    if (menuItem.variants.length === 0) {
      toast({
        title: "No variants configured",
        description: "Please add a variant for this item before ordering.",
        variant: "destructive",
      });
      return;
    }
    // If there's only one variant, select it automatically
    if (menuItem.variants.length === 1) {
      handleVariantSelect(menuItem.variants[0].id, menuItem.id);
    } else {
      setSelectedItemId(menuItem.id);
      setVariantDialogOpen(true);
    }
  };

  const handleVariantSelect = (
    variantId: string,
    originatingItemId?: string,
    note?: string
  ) => {
    const sourceItemId = originatingItemId ?? selectedItemId ?? null;
    const menuItem = sourceItemId
      ? menuItems.find((item) => item.id === sourceItemId)
      : undefined;
    if (!menuItem) return;

    const variant = menuItem.variants.find((v) => v.id === variantId);
    if (!variant) return;

    const newCart = new Map(cart);
    const cartItemKey = `${menuItem.id}-${variantId}`;
    const currentItem = newCart.get(cartItemKey);

    if (currentItem) {
      newCart.set(cartItemKey, {
        ...currentItem,
        quantity: currentItem.quantity + 1,
        note: note || currentItem.note,
      });
    } else {
      newCart.set(cartItemKey, {
        menuItemId: menuItem.id,
        variantId,
        quantity: 1,
        note,
      });
    }

    setCart(newCart);
    setSelectedItemId(null);
    setVariantDialogOpen(false);
  };

  const handleQuantityChange = (
    cartKey: string,
    operation: "add" | "remove"
  ) => {
    const newCart = new Map(cart);
    const currentItem = newCart.get(cartKey);
    if (!currentItem) return;

    if (operation === "add") {
      newCart.set(cartKey, {
        ...currentItem,
        quantity: currentItem.quantity + 1,
      });
    } else {
      if (currentItem.quantity > 1) {
        newCart.set(cartKey, {
          ...currentItem,
          quantity: currentItem.quantity - 1,
        });
      } else {
        newCart.delete(cartKey);
      }
    }
    setCart(newCart);
  };

  const handleSubmit = () => {
    if (cart.size === 0) {
      toast({
        title: "No Items Selected",
        description: "Please add items to the order.",
        variant: "destructive",
      });
      return;
    }

    const items = Array.from(cart.values()).map((item) => ({
      menuItemVariantId: item.variantId,
      quantity: item.quantity,
      note: item.note,
    }));

    onSubmit(items);
  };

  const filteredItems = menuItems
    ? menuItems.filter((item) => {
        // Filter by favorites or category
        if (activeCategory === "favorites") {
          if (!item.isFavorite) return false;
        } else if (item.categoryId !== activeCategory) {
          return false;
        }

        // Filter by search term
        const localized = getLocalizedName(item as any, language).toLowerCase();
        return localized.includes(searchTerm.toLowerCase());
      })
    : [];

  const [editingNote, setEditingNote] = useState<{
    cartKey: string;
    initialNote?: string;
    itemName: string;
  } | null>(null);

  const handleNoteEdit = (
    cartKey: string,
    initialNote: string | undefined,
    itemName: string
  ) => {
    setEditingNote({ cartKey, initialNote, itemName });
  };

  const handleNoteSave = (note: string) => {
    if (!editingNote) return;
    const newCart = new Map(cart);
    const currentItem = newCart.get(editingNote.cartKey);
    if (!currentItem) return;

    newCart.set(editingNote.cartKey, {
      ...currentItem,
      note: note || undefined,
    });
    setCart(newCart);
    setEditingNote(null);
  };

  const totalItems = Array.from(cart.values()).reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  // Get the display price range for a menu item
  const getItemPriceRange = (item: APIMenuItem) => {
    const prices = item.variants.map((v) => parseFloat(v.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `₹${minPrice.toFixed(2)}`
      : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`;
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCart(new Map());
            setSearchTerm("");
          }
          onOpenChange(isOpen);
        }}
      >
        <DialogContent className="max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 md:px-6 md:pt-6">
            <DialogTitle>Add Items to Order</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Browse menu items and add them to the current order
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 px-4 md:px-6">
            {/* Menu List */}
            <div className="lg:col-span-2 flex flex-col border-b lg:border-b-0 lg:border-r pb-4 lg:pb-0 pr-0 lg:pr-4 min-h-0">
              <Input
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-3 h-9"
              />
              <div className="flex space-x-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  key="favorites"
                  variant={
                    activeCategory === "favorites" ? "default" : "outline"
                  }
                  onClick={() => setActiveCategory("favorites")}
                  className="whitespace-nowrap h-8"
                  size="sm"
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Favorites
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      activeCategory === category.id ? "default" : "outline"
                    }
                    onClick={() => setActiveCategory(category.id)}
                    className="whitespace-nowrap h-8"
                    size="sm"
                  >
                    {getLocalizedName(category as any, language)}
                  </Button>
                ))}
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      {menuItems.length === 0 ? (
                        <p>No menu items available</p>
                      ) : (
                        <p>No items found in this category</p>
                      )}
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer hover:bg-accent/50 ${
                          item.isFavorite ? "border-yellow-400 border-2" : ""
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <CardContent className="p-3 relative">
                          {item.isFavorite && (
                            <Star className="absolute top-2 right-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          <p
                            className={`font-medium ${
                              item.isFavorite ? "pr-6" : ""
                            }`}
                          >
                            {getLocalizedName(item as any, language)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getItemPriceRange(item)}
                          </p>
                          {item.variants.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.variants.length} variants available
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            {/* Cart */}
            <div className="flex flex-col min-h-0">
              <h3 className="font-semibold mb-3 text-sm md:text-base">
                New Items
              </h3>
              <ScrollArea className="flex-1 min-h-0">
                {cart.size === 0 ? (
                  <div className="text-center text-muted-foreground pt-16">
                    <ShoppingCart className="mx-auto h-12 w-12 opacity-50" />
                    <p>No items added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from(cart.entries()).map(([cartKey, cartItem]) => {
                      const item = menuItems.find(
                        (mi) => mi.id === cartItem.menuItemId
                      );
                      if (!item) return null;
                      const variant = item?.variants.find(
                        (v) => v.id === cartItem.variantId
                      );
                      if (!item || !variant) return null;
                      return (
                        <div
                          key={cartKey}
                          className="flex flex-col p-2 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                {getLocalizedName(item as any, language)}
                              </p>
                              <p className="text-sm">
                                {getLocalizedName(variant as any, language)} - ₹
                                {parseFloat(variant.price).toFixed(2)}
                              </p>
                              {cartItem.note && (
                                <p className="text-sm text-muted-foreground italic">
                                  Note: {cartItem.note}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleNoteEdit(
                                    cartKey,
                                    cartItem.note,
                                    item.name
                                  )
                                }
                                title="Add/Edit Note"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleQuantityChange(cartKey, "remove")
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold">
                                {cartItem.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleQuantityChange(cartKey, "add")
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter className="px-4 pb-4 pt-3 md:px-6 md:pb-6 border-t mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
              <Badge variant="secondary" className="text-xs md:text-sm">
                New Items: {totalItems}
              </Badge>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full sm:w-auto h-10 md:h-11"
              >
                {isLoading ? "Adding..." : "Add to Order"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VariantSelectionDialog
        item={menuItems.find((item) => item.id === selectedItemId)}
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        onSelect={(variantId, note) =>
          handleVariantSelect(variantId, undefined, note)
        }
      />

      <EditNoteDialog
        open={!!editingNote}
        onOpenChange={(isOpen) => !isOpen && setEditingNote(null)}
        initialNote={editingNote?.initialNote}
        onSave={handleNoteSave}
        itemName={editingNote?.itemName || ""}
      />
    </>
  );
};
