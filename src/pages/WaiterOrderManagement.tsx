// src/pages/WaiterOrderManagement.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Minus,
  Receipt,
  Search,
  CheckCircle,
  XCircle,
  Save,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { apiService, ApiError } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import {
  APIMenuItem,
  MenuItem,
  OrderItem,
  OrderItemStatus,
} from "@/types/restaurant";

interface MenuCategory {
  id: string;
  name: string;
}

const WaiterOrderManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useWebSocket();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { orderId: incomingOrderId, tableId: incomingTableId } =
    location.state || {};

  const currentOrder = orders.find((order) => order.id === incomingOrderId);

  const { execute: executeCategories } = useApi<{ data: MenuCategory[] }>();
  const { execute: executeMenu } = useApi<{ data: APIMenuItem[] }>();
  const { loading: orderLoading, execute: executeOrder } = useApi<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, menuResponse] = await Promise.all([
          executeCategories(() => apiService.getMenuCategories()),
          executeMenu(() => apiService.getMenuItems()),
        ]);

        if (categoriesResponse) setCategories(categoriesResponse.data);
        if (menuResponse)
          setMenuItems(Array.isArray(menuResponse) ? menuResponse : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [executeCategories, executeMenu]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (currentOrder?.orderItems) {
      const loadedCartItems: OrderItem[] = currentOrder.orderItems
        .map((item: any) => {
          const menuItemDetails =
            item.menuItem || menuItems.find((mi) => mi.id === item.menuItemId);
          if (!menuItemDetails) {
            return null;
          }
          return {
            id: item.id,
            menuItem: {
              id: menuItemDetails.id,
              name: menuItemDetails.name,
              price: Number(menuItemDetails.price),
              category:
                categories.find((c) => c.id === menuItemDetails.categoryId)
                  ?.name || "Unknown",
              available: menuItemDetails.isAvailable,
            },
            quantity: item.quantity,
            status: item.status,
          };
        })
        .filter((item): item is OrderItem => item !== null);
      setCart(loadedCartItems);
    }
  }, [currentOrder, categories, menuItems]);

  const addToCart = (apiMenuItem: APIMenuItem) => {
    const menuItem: MenuItem = {
      id: apiMenuItem.id,
      name: apiMenuItem.name,
      price: Number(apiMenuItem.price),
      category:
        categories.find((c) => c.id === apiMenuItem.categoryId)?.name ||
        "Unknown",
      description: apiMenuItem.description || undefined,
      available: apiMenuItem.isAvailable,
    };

    const existingItem = cart.find(
      (item) => item.menuItem.id === menuItem.id && item.status === "PENDING"
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuItem.id === menuItem.id && item.status === "PENDING"
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newOrderItem: OrderItem = {
        id: `${Date.now()}-${menuItem.id}`,
        menuItem,
        quantity: 1,
        status: "PENDING",
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

  const handleUpdateItemStatus = async (
    itemId: string,
    status: "SERVED" | "CANCELLED"
  ) => {
    try {
      await apiService.updateOrderItemStatus(itemId, status);
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

  const handleCompleteOrder = async () => {
    if (!currentOrder) return;
    try {
      await apiService.completeOrder(currentOrder.id);
      toast({
        title: "Success",
        description: "Order marked as completed",
      });
      navigate("/tables");
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description: apiError.message || "Failed to complete order",
        variant: "destructive",
      });
    }
  };

  const processOrder = async () => {
    const newItems = cart
      .filter((item) => item.status === "PENDING")
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

    if (!incomingOrderId && !incomingTableId) {
      toast({
        title: "Error",
        description: "No table or order selected",
        variant: "destructive",
      });
      return;
    }

    try {
      let response;
      if (incomingOrderId) {
        response = await executeOrder(() =>
          apiService.addItemsToOrder(incomingOrderId, newItems)
        );
      } else if (incomingTableId) {
        response = await executeOrder(() =>
          apiService.createOrder({
            tableId: incomingTableId,
            items: newItems,
          })
        );
      }

      if (response) {
        navigate("/waiter-order", {
          state: { orderId: response.data.id, tableId: response.data.tableId },
        });
      }

      toast({
        title: "Success",
        description: "Order sent to kitchen",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process order",
        variant: "destructive",
      });
    }
  };

  const getBadgeVariant = (status: OrderItemStatus) => {
    switch (status) {
      case "PENDING":
        return "outline";
      case "ORDERED":
        return "secondary";
      case "PREPARING":
        return "warning";
      case "PREPARED":
        return "success";
      case "SERVED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const currentItems = menuItems.filter(
    (item) =>
      item.categoryId === activeCategory &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCompleteOrder =
    currentOrder &&
    currentOrder.orderItems.every(
      (item) => item.status === "SERVED" || item.status === "CANCELLED"
    );

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/tables")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tables
            </Button>
            <h1 className="text-3xl font-bold">Waiter Order Management</h1>
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

        {/* Categories & Menu */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "pos-selected" : "pos"}
              onClick={() => setActiveCategory(category.id)}
              className="px-6 whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto h-[calc(100vh-250px)]">
          {currentItems.map((item) => (
            <Button
              key={item.id}
              variant="pos"
              size="pos"
              onClick={() => addToCart(item)}
              className="h-32"
              disabled={!item.isAvailable}
            >
              <div className="w-full">
                <h3 className="font-semibold text-left line-clamp-2">
                  {item.name}
                </h3>
                <p className="text-primary font-bold text-left mt-2">
                  ${Number(item.price).toFixed(2)}
                </p>
                {!item.isAvailable && (
                  <Badge variant="secondary" className="mt-1">
                    Unavailable
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-card border-l border-border p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Current Order</h2>
          <Button variant="ghost" size="sm" onClick={() => setCart([])}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
          {cart.map((item) => (
            <div key={item.id} className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    ${item.menuItem.price.toFixed(2)} each
                  </p>
                  <Badge
                    variant={getBadgeVariant(item.status)}
                    className="mt-1"
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.status !== "PENDING"}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.status !== "PENDING"}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {item.status === "PREPARED" && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUpdateItemStatus(item.id, "SERVED")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Serve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleUpdateItemStatus(item.id, "CANCELLED")}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full bg-gradient-primary"
            onClick={processOrder}
            disabled={
              cart.filter((item) => item.status === "PENDING").length === 0 ||
              orderLoading
            }
          >
            <Save className="mr-2 h-5 w-5" />
            {orderLoading ? "Processing..." : "Send to Kitchen"}
          </Button>
          {currentOrder && (
            <Button
              size="lg"
              className="w-full"
              variant="outline"
              onClick={handleCompleteOrder}
              disabled={!canCompleteOrder}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Complete Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterOrderManagement;
