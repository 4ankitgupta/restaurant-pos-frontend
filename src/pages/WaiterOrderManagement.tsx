import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { APIMenuItem } from "@/types/restaurant";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Minus,
  ArrowLeft,
  Search,
  Trash2,
  Save,
  CheckCircle,
} from "lucide-react";

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  restaurantId: string;
}

interface OrderItem {
  id: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
    category: string;
    available: boolean;
  };
  quantity: number;
  status: "pending" | "preparing" | "ready" | "served";
}

const WaiterOrderManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { orderId, tableId } = location.state || {};

  const { loading: categoriesLoading, execute: executeCategories } = useApi<{ data: MenuCategory[] }>();
  const { loading: menuLoading, execute: executeMenu } = useApi<{ data: APIMenuItem[] }>();
  const { loading: orderLoading, execute: executeOrder } = useApi<any>();
  const { execute: executeGetOrder } = useApi<any>();
  const { execute: executeAddItems } = useApi<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, menuResponse] = await Promise.all([
          executeCategories(() => apiService.getMenuCategories()),
          executeMenu(() => apiService.getMenuItems()),
        ]);

        if (categoriesResponse) setCategories(categoriesResponse.data);
        if (menuResponse) setMenuItems(Array.isArray(menuResponse) ? menuResponse : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  // Load existing order if orderId is provided
  useEffect(() => {
    const loadOrder = async (orderIdParam: string) => {
      try {
        const response = await executeGetOrder(() =>
          apiService.getOrderDetails(orderIdParam)
        );
        if (response?.data?.orderItems) {
          const loadedCartItems: OrderItem[] = response.data.orderItems.map(
            (item: any) => ({
              id: item.id,
              menuItem: {
                id: item.menuItem.id,
                name: item.menuItem.name,
                price: Number(item.menuItem.price),
                category: item.menuItem.category?.name || "Unknown",
                available: item.menuItem.isAvailable,
              },
              quantity: item.quantity,
              status: "served",
            })
          );
          setCart(loadedCartItems);
        }
      } catch (error) {
        console.error("Failed to load order details:", error);
      }
    };

    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  // Set first category as active when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const addToCart = (apiMenuItem: APIMenuItem) => {
    const menuItem = {
      id: apiMenuItem.id,
      name: apiMenuItem.name,
      price: Number(apiMenuItem.price),
      category:
        categories.find((c) => c.id === apiMenuItem.categoryId)?.name || "Unknown",
      available: apiMenuItem.isAvailable,
    };

    const existingItem = cart.find((item) => item.menuItem.id === menuItem.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newOrderItem: OrderItem = {
        id: `${Date.now()}-${menuItem.id}`,
        menuItem,
        quantity: 1,
        status: "pending",
      };
      setCart([...cart, newOrderItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.id !== itemId));
    } else {
      setCart(
        cart.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  const saveOrder = async () => {
    if (!tableId) {
      toast({
        title: "Error",
        description: "No table selected",
        variant: "destructive",
      });
      return;
    }

    const newItems = cart
      .filter((item) => item.status === "pending")
      .map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      }));

    if (newItems.length === 0) {
      toast({
        title: "Info",
        description: "No new items to add",
      });
      return;
    }

    try {
      if (orderId) {
        // Update existing order
        await executeAddItems(() =>
          apiService.addItemsToOrder(orderId, newItems)
        );
      } else {
        // Create new order
        await executeOrder(() =>
          apiService.createOrder({
            tableId: tableId,
            items: newItems,
          })
        );
      }

      toast({
        title: "Success",
        description: "Order saved successfully",
      });

      // Mark items as served
      setCart(cart.map(item => ({ ...item, status: "served" as const })));
    } catch (error) {
      console.error("Failed to save order:", error);
    }
  };

  const goBack = () => {
    navigate("/tables");
  };

  const currentItems = menuItems.filter(
    (item) =>
      item.categoryId === activeCategory &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Menu Section */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tables
            </Button>
            <h1 className="text-3xl font-bold">Order Management</h1>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table Info */}
        {tableId && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                  Managing order for Table {tableId}
                </div>
                {orderId && (
                  <Badge variant="outline">Order ID: {orderId.slice(0, 8)}...</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => setActiveCategory(category.id)}
              className="px-6 whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto h-[calc(100vh-350px)]">
          {currentItems.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              onClick={() => addToCart(item)}
              className="h-32 p-4 flex flex-col justify-between"
              disabled={!item.isAvailable}
            >
              <div className="w-full text-left">
                <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                  {item.name}
                </h3>
                <p className="text-primary font-bold">
                  ${Number(item.price).toFixed(2)}
                </p>
                {!item.isAvailable && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Unavailable
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Order Summary Section */}
      <div className="w-96 bg-card border-l border-border p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Order Summary</h2>
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items in order</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.status === "served" ? "bg-muted/30" : "bg-background"
                }`}
              >
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    ${item.menuItem.price.toFixed(2)} each
                  </p>
                  {item.status === "served" && (
                    <Badge variant="outline" className="text-xs mt-1">
                      In Kitchen
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.status === "served"}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.status === "served"}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Total */}
        {cart.length > 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-primary"
              onClick={saveOrder}
              disabled={orderLoading || cart.filter(item => item.status === "pending").length === 0}
            >
              <Save className="mr-2 h-5 w-5" />
              {orderLoading ? "Saving..." : "Save Order"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterOrderManagement;