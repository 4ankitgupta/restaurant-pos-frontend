import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { APIMenuItem } from "@/types/restaurant";
import { useState, useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Plus, Minus, ShoppingCart, MessageSquare } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";
import { VariantSelectionDialog } from "./VariantSelectionDialog";
import { EditNoteDialog } from "./EditNoteDialog";

interface MenuCategory {
  id: string;
  name: string;
}

interface CartItem {
  variantId: string;
  quantity: number;
  note?: string;
  menuItemId: string;
}

interface TakeawayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItems: APIMenuItem[];
  categories: MenuCategory[];
  onSubmit: (
    items: { menuItemVariantId: string; quantity: number; note?: string }[]
  ) => void;
  isLoading: boolean;
}

export const TakeawayDialog: React.FC<TakeawayDialogProps> = ({
  open,
  onOpenChange,
  menuItems,
  categories,
  onSubmit,
  isLoading,
}) => {
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    cartKey: string;
    initialNote?: string;
    itemName: string;
  } | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

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

  const handleSubmit = () => {
    if (cart.size === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to create an order.",
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
    ? menuItems.filter(
        (item) =>
          item.categoryId === activeCategory &&
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const totalItems = Array.from(cart.values()).reduce(
    (acc, item) => acc + item.quantity,
    0
  );

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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create Take-away Order</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Menu List */}
            <div className="lg:col-span-2 flex flex-col border-b lg:border-b-0 lg:border-r pb-4 lg:pb-0 pr-0 lg:pr-4">
              <Input
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      activeCategory === category.id ? "default" : "outline"
                    }
                    onClick={() => setActiveCategory(category.id)}
                    className="whitespace-nowrap"
                    size="sm"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
              <ScrollArea className="h-[300px] lg:h-[400px]">
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
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleItemClick(item)}
                      >
                        <CardContent className="p-3">
                          <p className="font-medium">{item.name}</p>
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
            <div className="flex flex-col">
              <h3 className="font-semibold mb-4">Order Items</h3>
              <ScrollArea className="h-[300px] lg:h-[400px]">
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
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm">
                                {variant.name} - ₹
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
          <DialogFooter>
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
              <Badge variant="secondary">Total Items: {totalItems}</Badge>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Creating..." : "Create Take-away Order"}
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
