import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, Search, ArrowLeft, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { APIMenuItem, OrderItemStatus } from "@/types/restaurant";
import { OrderSummarySheet } from "@/components/waiter/OrderSummarySheet";
import { OrderSummaryFAB } from "@/components/waiter/OrderSummaryFAB";

interface MenuCategory {
  id: string;
  name: string;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

const WaiterOrderManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useWebSocket();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { orderId: incomingOrderId, tableId: incomingTableId } =
    location.state || {};

  const currentOrder = orders.find((order) => order.id === incomingOrderId);

  const { execute: executeCategories } = useApi<{ data: MenuCategory[] }>();
  const { execute: executeMenu } = useApi<{ data: APIMenuItem[] }>();
  const { loading: isSending, execute: executeSend } = useApi<any>();
  const { loading: isCompleting, execute: executeComplete } = useApi<any>();
  const { execute: executeUpdateStatus } = useApi<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, menuResponse] = await Promise.all([
          executeCategories(() => apiService.getMenuCategories()),
          executeMenu(() => apiService.getMenuItems()),
        ]);

        if (categoriesResponse) setCategories(categoriesResponse.data);
        if (menuResponse) setMenuItems(menuResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories]);

  const addToCart = (item: APIMenuItem) => {
    const existingItem = cart.find((i) => i.menuItemId === item.id);

    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter((item) => item.menuItemId !== menuItemId));
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;

    const items = cart.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
    }));

    try {
      if (currentOrder) {
        await executeSend(() =>
          apiService.addItemsToOrder(currentOrder.id, items)
        );
        toast({
          title: "Success",
          description: "Items added to order",
        });
      } else if (incomingTableId) {
        await executeSend(() =>
          apiService.createOrder({
            tableId: incomingTableId,
            items,
          })
        );
        toast({
          title: "Success",
          description: "Order created and sent to kitchen",
        });
      }
      setCart([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send order",
        variant: "destructive",
      });
    }
  };

  const handleCompleteOrder = async () => {
    if (!currentOrder) return;

    try {
      await executeComplete(() => apiService.completeOrder(currentOrder.id));
      toast({
        title: "Success",
        description: "Order completed",
      });
      navigate("/tables");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete order",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItemStatus = async (
    itemId: string,
    status: "SERVED" | "CANCELLED"
  ) => {
    try {
      await executeUpdateStatus(() =>
        apiService.updateOrderItemStatus(itemId, status)
      );
      toast({
        title: "Success",
        description: `Item marked as ${status.toLowerCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      !activeCategory || item.categoryId === activeCategory;
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const existingTotal = currentOrder?.totalAmount || 0;
  const grandTotal = existingTotal + cartTotal;

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      {/* Header */}
      <header className="bg-card border-b p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/tables")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {currentOrder
              ? `Table ${currentOrder.table?.tableNumber || "N/A"}`
              : "New Order"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Take or manage table order
          </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  activeCategory === category.id ? "default" : "outline"
                }
                onClick={() => setActiveCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 lg:pb-4">
              {filteredItems.map((item) => {
                const cartItem = cart.find((i) => i.menuItemId === item.id);
                return (
                  <Card
                    key={item.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-start justify-between">
                        <span>{item.name}</span>
                        <Badge
                          variant={item.isAvailable ? "default" : "secondary"}
                        >
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </CardTitle>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          ₹{Number(item.price).toFixed(2)}
                        </span>
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {cartItem.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(item)}
                            disabled={!item.isAvailable}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop Order Summary - Sticky */}
        <div className="hidden lg:flex lg:w-96 border-l bg-card">
          <div className="flex flex-col w-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Current Order</h2>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {/* Existing Order Items */}
                {currentOrder && currentOrder.orderItems.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      Current Items
                    </h3>
                    {currentOrder.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border-2 mb-2 ${
                          item.status === "PREPARED"
                            ? "border-success bg-success/10"
                            : "border-muted"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold">
                              {item.quantity}x {item.menuItem.name}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {item.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                            {item.status === "PREPARED" && (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() =>
                                  handleUpdateItemStatus(item.id, "SERVED")
                                }
                              >
                                Served
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Separator className="my-3" />
                  </div>
                )}

                {/* Cart Items */}
                {cart.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      New Items
                    </h3>
                    {cart.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="p-3 rounded-lg border bg-card mb-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold">
                              {item.quantity}x {item.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeFromCart(item.menuItemId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Sticky Footer */}
            <div className="border-t p-4 space-y-3 bg-card">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              {cart.length > 0 && (
                <Button
                  onClick={handleSendToKitchen}
                  disabled={isSending}
                  className="w-full bg-gradient-primary"
                  size="lg"
                >
                  {isSending ? "Sending..." : "Send to Kitchen"}
                </Button>
              )}

              {currentOrder &&
                currentOrder.orderItems.length > 0 &&
                currentOrder.status !== "COMPLETED" && (
                  <Button
                    onClick={handleCompleteOrder}
                    disabled={isCompleting}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {isCompleting ? "Completing..." : "Complete Order"}
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <OrderSummaryFAB
        itemCount={cartItemCount}
        totalAmount={grandTotal}
        onClick={() => setIsSheetOpen(true)}
      />

      {/* Mobile Order Sheet */}
      <OrderSummarySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        cart={cart}
        existingOrder={currentOrder || null}
        onRemoveFromCart={removeFromCart}
        onUpdateItemStatus={handleUpdateItemStatus}
        onSendToKitchen={handleSendToKitchen}
        onCompleteOrder={handleCompleteOrder}
        isSending={isSending}
        isCompleting={isCompleting}
      />
    </div>
  );
};

export default WaiterOrderManagement;
