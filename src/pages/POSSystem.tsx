// src/pages/POSSystem.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MenuItem,
  OrderItem,
  APIMenuItem,
  OrderItemStatus,
} from "@/types/restaurant";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Receipt,
  Trash2,
  Search,
  Smartphone,
  Wallet,
} from "lucide-react";

interface MenuCategory {
  id: string;
  name: string;
}

interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "Available" | "Occupied" | "Reserved" | "NeedCleaning";
}

const POSSystem: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "UPI" | "WALLET"
  >("CASH");

  const { orderId: incomingOrderId, tableId: incomingTableId } =
    location.state || {};

  const { execute: executeCategories } = useApi<{ data: MenuCategory[] }>();
  const { execute: executeMenu } = useApi<{ data: APIMenuItem[] }>();
  const { execute: executeTables } = useApi<{ data: Table[] }>();
  const { loading: orderLoading, execute: executeOrder } = useApi<any>();
  const { loading: paymentLoading, execute: executePayment } = useApi<any>();
  const { execute: executeGetOrder } = useApi<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, menuResponse, tablesResponse] =
          await Promise.all([
            executeCategories(() => apiService.getMenuCategories()),
            executeMenu(() => apiService.getMenuItems()),
            executeTables(() => apiService.getTables()),
          ]);

        if (categoriesResponse) setCategories(categoriesResponse.data);
        if (menuResponse)
          setMenuItems(Array.isArray(menuResponse) ? menuResponse : []);
        if (tablesResponse) setTables(tablesResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, [executeCategories, executeMenu, executeTables]);

  useEffect(() => {
    if (incomingOrderId && incomingTableId) {
      setSelectedTableId(incomingTableId);
      setCurrentOrderId(incomingOrderId);
      const loadOrder = async () => {
        try {
          const response = await executeGetOrder(() =>
            apiService.getOrderDetails(incomingOrderId)
          );
          if (response?.data?.orderItems) {
            const loadedCartItems: OrderItem[] = response.data.orderItems.map(
              (item: any) => ({
                id: item.id,
                menuItemVariant: {
                  id: item.menuItemVariant.id,
                  name: item.menuItemVariant.name,
                  price: item.menuItemVariant.price,
                  menuItem: {
                    id: item.menuItemVariant.menuItem.id,
                    name: item.menuItemVariant.menuItem.name,
                    description:
                      item.menuItemVariant.menuItem.description || undefined,
                    category:
                      item.menuItemVariant.menuItem.category?.name || "Unknown",
                    available: item.menuItemVariant.menuItem.isAvailable,
                  },
                },
                quantity: item.quantity,
                status: item.status,
                note: item.note,
                price: item.price,
              })
            );
            setCart(loadedCartItems);
          }
        } catch (error) {
          console.error("Failed to load order details:", error);
          navigate("/tables");
        }
      };
      loadOrder();
    }
  }, [incomingOrderId, incomingTableId, executeGetOrder, navigate]);

  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const addToCart = (apiMenuItem: APIMenuItem) => {
    // Simple variant selection via prompt if multiple variants
    let variant = apiMenuItem.variants[0];
    if (apiMenuItem.variants.length > 1) {
      const choices = apiMenuItem.variants
        .map(
          (v, i) => `${i + 1}. ${v.name} - $${parseFloat(v.price).toFixed(2)}`
        )
        .join("\n");
      const sel = window.prompt(
        `Select variant for ${apiMenuItem.name}:\n${choices}`
      );
      const idx = sel ? Number(sel) - 1 : -1;
      if (isNaN(idx) || idx < 0 || idx >= apiMenuItem.variants.length) return;
      variant = apiMenuItem.variants[idx];
    }

    const existingItem = cart.find(
      (item) => item.menuItemVariant?.id === variant.id
    );
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuItemVariant?.id === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: Date.now().toString(),
          menuItemVariant: {
            id: variant.id,
            name: variant.name,
            price: Number(variant.price),
            menuItem: {
              id: apiMenuItem.id,
              name: apiMenuItem.name,
              description: apiMenuItem.description || undefined,
              category:
                categories.find((c) => c.id === apiMenuItem.categoryId)?.name ||
                "Unknown",
              available: apiMenuItem.isAvailable,
            },
          },
          quantity: 1,
          status: "ORDERED" as OrderItemStatus,
          price: Number(variant.price),
        },
      ]);
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

  const getTotal = () =>
    cart.reduce(
      (total, item) =>
        total +
        (item.price ?? item.menuItemVariant?.price ?? 0) * item.quantity,
      0
    );

  const processOrder = async () => {
    const newItems = cart
      .filter((item) => !item.id.includes("-")) // Filter for backend-generated IDs
      .map((item) => ({
        menuItemVariantId: item.menuItemVariant?.id,
        quantity: item.quantity,
        note: (item as any).note,
      }));

    if (newItems.length === 0) {
      setPaymentDialogOpen(true);
      return;
    }

    if (!currentOrderId) return;

    try {
      await executeOrder(() =>
        apiService.addItemsToOrder(currentOrderId, newItems)
      );
      setPaymentDialogOpen(true);
    } catch (error) {
      console.error("Failed to add items to order:", error);
    }
  };

  const processPayment = async () => {
    if (!currentOrderId) return;

    try {
      await executePayment(() =>
        apiService.createPayment({
          orderId: currentOrderId,
          amount: getTotal(),
          paymentMethod,
        })
      );
      await apiService.updateTableStatus(selectedTableId, "NeedCleaning");

      setCart([]);
      setSelectedTableId("");
      setCurrentOrderId("");
      setPaymentDialogOpen(false);
      navigate("/tables");
    } catch (error) {
      console.error("Failed to process payment:", error);
    }
  };

  const getBadgeVariant = (status: OrderItemStatus) => {
    switch (status) {
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

  return (
    <div className="flex h-screen bg-background">
      {/* Menu Section */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">POS System</h1>
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
                  {item.variants && item.variants.length === 1
                    ? `$${parseFloat(item.variants[0].price).toFixed(2)}`
                    : `From $${Math.min(
                        ...item.variants.map((v) => parseFloat(v.price))
                      ).toFixed(2)}`}
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

        <div className="mb-4">
          <Select
            value={selectedTableId}
            onValueChange={setSelectedTableId}
            disabled={!!incomingTableId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {tables
                .filter((table) => table.status === "Available")
                .map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    Table {table.tableNumber} (Capacity: {table.capacity})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items in cart</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-sm">
                    {item.menuItemVariant?.menuItem?.name || "Item"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    $
                    {(item.price ?? item.menuItemVariant?.price ?? 0).toFixed(
                      2
                    )}{" "}
                    each
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
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.status !== "ORDERED"}
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
                    disabled={item.status !== "ORDERED"}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-primary"
              onClick={processOrder}
              disabled={!selectedTableId || cart.length === 0 || orderLoading}
            >
              <Receipt className="mr-2 h-5 w-5" />
              {orderLoading ? "Processing..." : "Process Order & Pay"}
            </Button>
          </div>
        )}

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold">${getTotal().toFixed(2)}</p>
                <p className="text-muted-foreground">Total Amount</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={paymentMethod === "CASH" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("CASH")}
                    className="flex-col h-16"
                  >
                    <DollarSign className="h-5 w-5 mb-1" />
                    <span className="text-xs">Cash</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "CARD" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("CARD")}
                    className="flex-col h-16"
                  >
                    <CreditCard className="h-5 w-5 mb-1" />
                    <span className="text-xs">Card</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "UPI" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("UPI")}
                    className="flex-col h-16"
                  >
                    <Smartphone className="h-5 w-5 mb-1" />
                    <span className="text-xs">UPI</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "WALLET" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("WALLET")}
                    className="flex-col h-16"
                  >
                    <Wallet className="h-5 w-5 mb-1" />
                    <span className="text-xs">Wallet</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={processPayment} disabled={paymentLoading}>
                  {paymentLoading ? "Processing..." : "Complete Payment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default POSSystem;
