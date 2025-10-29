import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { APIMenuItem } from "@/types/restaurant";
import { useState, useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";

interface MenuCategory {
  id: string;
  name: string;
}

interface TakeawayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItems: APIMenuItem[];
  categories: MenuCategory[];
  // Now submit variant-based items
  onSubmit: (items: { menuItemVariantId: string; quantity: number }[]) => void;
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
  // cart maps menuItemVariantId -> qty
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // When user clicks an APIMenuItem card, choose a variant (if multiple)
  const handleItemClick = (apiItemId: string, operation: "add" | "remove") => {
    const apiItem = menuItems.find((m) => m.id === apiItemId);
    if (!apiItem) return;

    // If multiple variants, prompt selection; otherwise pick first
    let variant = apiItem.variants[0];
    if (apiItem.variants.length > 1) {
      const choices = apiItem.variants
        .map(
          (v, i) => `${i + 1}. ${v.name} - ₹${parseFloat(v.price).toFixed(2)}`
        )
        .join("\n");
      const sel = window.prompt(
        `Select variant for ${apiItem.name}:\n${choices}`
      );
      const idx = sel ? Number(sel) - 1 : -1;
      if (isNaN(idx) || idx < 0 || idx >= apiItem.variants.length) return;
      variant = apiItem.variants[idx];
    }

    const variantId = variant.id;
    const newCart = new Map(cart);
    const currentQty = newCart.get(variantId) || 0;
    if (operation === "add") {
      newCart.set(variantId, currentQty + 1);
    } else {
      if (currentQty > 1) {
        newCart.set(variantId, currentQty - 1);
      } else {
        newCart.delete(variantId);
      }
    }
    setCart(newCart);
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
    const items = Array.from(cart.entries()).map(
      ([menuItemVariantId, quantity]) => ({
        menuItemVariantId,
        quantity,
      })
    );
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
    (acc, qty) => acc + qty,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Take-away Order</DialogTitle>
          <DialogDescription>
            Select items to create a new take-away order.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4">
          {/* Menu List */}
          <div className="col-span-2 flex flex-col border-r pr-4">
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
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => handleItemClick(item.id, "add")}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.variants && item.variants.length === 1
                          ? `₹${parseFloat(item.variants[0].price).toFixed(2)}`
                          : `From ₹${Math.min(
                              ...item.variants.map((v) => parseFloat(v.price))
                            ).toFixed(2)}`}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
          {/* Cart */}
          <div className="flex flex-col">
            <h3 className="font-semibold mb-4">Current Order</h3>
            <ScrollArea className="h-[400px]">
              {cart.size === 0 ? (
                <div className="text-center text-muted-foreground pt-16">
                  <ShoppingCart className="mx-auto h-12 w-12 opacity-50" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from(cart.entries()).map(([variantId, quantity]) => {
                    // Find the parent menu item and variant
                    const parent = menuItems.find((mi) =>
                      mi.variants.some((v) => v.id === variantId)
                    );
                    const variant = parent?.variants.find(
                      (v) => v.id === variantId
                    );
                    if (!parent || !variant) return null;
                    return (
                      <div
                        key={variantId}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">
                            {parent.name} ({variant.name})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ₹{parseFloat(variant.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleItemClick(parent.id, "remove")}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold">{quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleItemClick(parent.id, "add")}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
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
          <div className="flex items-center justify-between w-full">
            <Badge variant="secondary">Total Items: {totalItems}</Badge>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
