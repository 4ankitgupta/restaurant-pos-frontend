import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { APIMenuItem } from "@/types/restaurant";
import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "@/hooks/use-toast";

interface AddItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItems: APIMenuItem[];
  onSubmit: (items: { menuItemId: string; quantity: number }[]) => void;
  isLoading: boolean;
}

export const AddItemsDialog: React.FC<AddItemsDialogProps> = ({
  open,
  onOpenChange,
  menuItems,
  onSubmit,
  isLoading,
}) => {
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");

  const handleItemClick = (itemId: string, operation: "add" | "remove") => {
    const newCart = new Map(cart);
    const currentQty = newCart.get(itemId) || 0;
    if (operation === "add") {
      newCart.set(itemId, currentQty + 1);
    } else {
      if (currentQty > 1) {
        newCart.set(itemId, currentQty - 1);
      } else {
        newCart.delete(itemId);
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
    const items = Array.from(cart.entries()).map(([menuItemId, quantity]) => ({
      menuItemId,
      quantity,
    }));
    onSubmit(items);
  };

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = Array.from(cart.values()).reduce(
    (acc, qty) => acc + qty,
    0
  );

  return (
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Items to Order</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {/* Menu List */}
          <div className="flex flex-col border-r pr-4">
            <Input
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleItemClick(item.id, "add")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          {/* Cart */}
          <div className="flex flex-col">
            <h3 className="font-semibold mb-4">New Items</h3>
            <ScrollArea className="h-[400px]">
              {cart.size === 0 ? (
                <div className="text-center text-muted-foreground pt-16">
                  <ShoppingCart className="mx-auto h-12 w-12 opacity-50" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from(cart.entries()).map(([itemId, quantity]) => {
                    const item = menuItems.find((mi) => mi.id === itemId);
                    if (!item) return null;
                    return (
                      <div
                        key={itemId}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleItemClick(item.id, "remove")}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold">{quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleItemClick(item.id, "add")}
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
            <Badge variant="secondary">New Items: {totalItems}</Badge>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add to Order"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
