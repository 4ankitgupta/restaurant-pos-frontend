// src/components/waiter/AddItemsDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, MessageSquare, ShoppingCart, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { APIMenuItem } from "@/types/restaurant";
import { VariantSelectionDialog } from "@/components/cashier/VariantSelectionDialog";
import { EditNoteDialog } from "@/components/cashier/EditNoteDialog";

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
  const [editingNote, setEditingNote] = useState<{
    cartKey: string;
    initialNote?: string;
    itemName: string;
  } | null>(null);

  const handleItemClick = (menuItem: APIMenuItem) => {
    if (menuItem.variants.length === 1) {
      handleVariantSelect(menuItem.variants[0].id);
    } else {
      setSelectedItemId(menuItem.id);
      setVariantDialogOpen(true);
    }
  };

  const handleVariantSelect = (variantId: string, note?: string) => {
    const menuItem = selectedItemId
      ? menuItems.find((item) => item.id === selectedItemId)
      : undefined;
    if (!menuItem) return;

    const newCart = new Map(cart);
    const key = `${menuItem.id}-${variantId}`;
    const existing = newCart.get(key);

    if (existing) {
      newCart.set(key, {
        ...existing,
        quantity: existing.quantity + 1,
        note: note || existing.note,
      });
    } else {
      newCart.set(key, {
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
    const item = newCart.get(editingNote.cartKey);
    if (!item) return;
    newCart.set(editingNote.cartKey, { ...item, note });
    setCart(newCart);
    setEditingNote(null);
  };

  const handleQuantityChange = (key: string, action: "add" | "remove") => {
    const newCart = new Map(cart);
    const item = newCart.get(key);
    if (!item) return;
    if (action === "add") item.quantity += 1;
    else if (item.quantity > 1) item.quantity -= 1;
    else newCart.delete(key);
    setCart(new Map(newCart));
  };

  const handleSubmit = () => {
    if (cart.size === 0) {
      toast({
        title: "No items selected",
        description: "Please add some items.",
        variant: "destructive",
      });
      return;
    }
    const items = Array.from(cart.values()).map((i) => ({
      menuItemVariantId: i.variantId,
      quantity: i.quantity,
      note: i.note,
    }));
    onSubmit(items);
  };

  const filteredItems = menuItems.filter((item) => {
    // Filter by favorites or category
    if (activeCategory === "favorites") {
      if (!item.isFavorite) return false;
    } else if (item.categoryId !== activeCategory) {
      return false;
    }

    // Filter by search term
    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalItems = Array.from(cart.values()).reduce(
    (sum, i) => sum + i.quantity,
    0
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Items to Order</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Menu */}
            <div className="lg:col-span-2 flex flex-col border-b lg:border-b-0 lg:border-r pr-0 lg:pr-4">
              <Input
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                <Button
                  key="favorites"
                  variant={
                    activeCategory === "favorites" ? "default" : "outline"
                  }
                  onClick={() => setActiveCategory("favorites")}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Star className="h-4 w-4 mr-1 fill-current" />
                  Favorites
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    onClick={() => setActiveCategory(cat.id)}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
              <ScrollArea className="h-[320px] lg:h-[420px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredItems.map((item) => (
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
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.variants[0]?.price ?? 0}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Cart */}
            <div className="flex flex-col">
              <h3 className="font-semibold mb-4">New Items</h3>
              <ScrollArea className="h-[320px] lg:h-[420px]">
                {cart.size === 0 ? (
                  <div className="text-center text-muted-foreground pt-16">
                    <ShoppingCart className="mx-auto h-12 w-12 opacity-50" />
                    <p>No items added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from(cart.entries()).map(([key, item]) => {
                      const menuItem = menuItems.find(
                        (m) => m.id === item.menuItemId
                      );
                      const variant = menuItem?.variants.find(
                        (v) => v.id === item.variantId
                      );
                      if (!menuItem || !variant) return null;
                      return (
                        <div
                          key={key}
                          className="flex flex-col p-2 rounded-md bg-muted/50"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium">{menuItem.name}</p>
                              <p className="text-sm">
                                {variant.name} - ₹
                                {parseFloat(variant.price).toFixed(2)}
                              </p>
                              {item.note && (
                                <p className="text-sm text-muted-foreground italic">
                                  Note: {item.note}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleNoteEdit(key, item.note, menuItem.name)
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
                                  handleQuantityChange(key, "remove")
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleQuantityChange(key, "add")}
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
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2">
              <Badge variant="secondary">Total Items: {totalItems}</Badge>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Adding..." : "Add to Order"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <VariantSelectionDialog
        item={menuItems.find((item) => item.id === selectedItemId)}
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        onSelect={handleVariantSelect}
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
