import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MenuItem, OrderItem, APIMenuItem } from "@/types/restaurant";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { useLocation, useNavigate } from "react-router-dom";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { toast } from "@/hooks/use-toast";
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
  CheckCircle,
  Clock,
} from "lucide-react";

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  restaurantId: string;
}

// FIX: Add "NeedCleaning" to the status types
interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "Available" | "Occupied" | "Reserved" | "NeedCleaning";
  restaurantId: string;
}

const POSSystem: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useWebSocket();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  const { orderId: incomingOrderId, tableId: incomingTableId } =
    location.state || {};

  // Get current order from WebSocket context
  const currentOrder = orders.find(order => order.id === incomingOrderId);

  const { loading: categoriesLoading, execute: executeCategories } = useApi<{
    data: MenuCategory[];
  }>();
  const { loading: menuLoading, execute: executeMenu } =
    useApi<{ data: APIMenuItem[] }>();
  const { loading: tablesLoading, execute: executeTables } = useApi<{
    data: Table[];
  }>();
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
        // Menu items API returns array directly, not wrapped in data property
        if (menuResponse) setMenuItems(Array.isArray(menuResponse) ? menuResponse : []);
        if (tablesResponse) setTables(tablesResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [executeCategories, executeMenu, executeTables]);

  useEffect(() => {
    const loadOrder = async (orderId: string, tableId: string) => {
      setSelectedTableId(tableId);
      setCurrentOrderId(orderId);
      try {
        const response = await executeGetOrder(() =>
          apiService.getOrderDetails(orderId)
        );
        if (response && response.data && response.data.orderItems) {
          // Convert fetched order items to cart format
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
              status: "served", // Assume existing items are served
            })
          );
          setCart(loadedCartItems);
        }
      } catch (error) {
        console.error("Failed to load order details:", error);
        // If order load fails, navigate back or show error
        navigate("/tables");
      }
    };

    if (incomingOrderId && incomingTableId) {
      loadOrder(incomingOrderId, incomingTableId);
    }
  }, [incomingOrderId, incomingTableId, executeGetOrder, navigate]);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "UPI" | "WALLET"
  >("CASH");

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      await apiService.updateOrderStatus(orderId, status);
      toast({
        title: "Success",
        description: `Order ${status.toLowerCase()} successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Set first category as active when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const addToCart = (apiMenuItem: APIMenuItem) => {
    // Convert API menu item to our MenuItem format
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

  const getTax = () => {
    return getTotal() * 0.1; // 10% tax
  };

  const getFinalTotal = () => {
    return getTotal() + getTax();
  };

  const processOrder = async () => {
    // Filter out items that are already "served"
    const newItems = cart
      .filter((item) => item.status === "pending")
      .map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      }));

    if (newItems.length === 0) {
      setPaymentDialogOpen(true); // No new items, proceed to payment
      return;
    }
    if (!currentOrderId) return; // Must have an order ID now

    try {
      const response = await executeOrder(() =>
        apiService.addItemsToOrder(currentOrderId, newItems)
      );

      if (response) {
        setPaymentDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to add items to order:", error);
    }
  };

  const processPayment = async () => {
    if (!currentOrderId) return;

    try {
      await executePayment(() =>
        apiService.createPayment({
          orderId: currentOrderId, // Use the actual order ID
          amount: getFinalTotal(),
          paymentMethod,
        })
      );
      // On successful payment, also update the table status to 'NeedCleaning'
      await apiService.updateTableStatus(selectedTableId, "NeedCleaning");

      setCart([]);
      setSelectedTableId("");
      setCurrentOrderId("");
      setPaymentDialogOpen(false);
      navigate("/tables"); // Navigate back to table management
    } catch (error) {
      console.error("Failed to process payment:", error);
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

        {/* Category Tabs */}
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

        {/* Menu Grid */}
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
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Order Status */}
        {currentOrder && (
          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Order Status:</span>
              <Badge className={
                currentOrder.status === 'PENDING' ? 'bg-secondary' :
                currentOrder.status === 'ORDERED' ? 'bg-warning text-warning-foreground' :
                currentOrder.status === 'PREPARING' ? 'bg-warning text-warning-foreground' :
                currentOrder.status === 'PREPARED' ? 'bg-success text-success-foreground' :
                currentOrder.status === 'SERVED' ? 'bg-success text-success-foreground' :
                'bg-muted'
              }>
                {currentOrder.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Payment Status:</span>
              <Badge className={
                currentOrder.paymentStatus === 'UNPAID' ? 'bg-destructive text-destructive-foreground' :
                currentOrder.paymentStatus === 'PARTIAL' ? 'bg-warning text-warning-foreground' :
                'bg-success text-success-foreground'
              }>
                {currentOrder.paymentStatus}
              </Badge>
            </div>
            
            {/* Order Actions */}
            <div className="space-y-2 mt-3">
              {currentOrder.status === 'PREPARED' && (
                <Button 
                  onClick={() => handleOrderStatusUpdate(currentOrder.id, 'SERVED')}
                  className="w-full bg-success text-success-foreground"
                  size="sm"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Served
                </Button>
              )}
              
              {currentOrder.status === 'SERVED' && currentOrder.paymentStatus === 'PAID' && (
                <Button 
                  onClick={() => handleOrderStatusUpdate(currentOrder.id, 'COMPLETED')}
                  className="w-full bg-gradient-primary"
                  size="sm"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Order
                </Button>
              )}
            </div>
          </div>
        )}

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

        {/* Cart Items */}
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
                  <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    ${item.menuItem.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
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
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        {cart.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>${getTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${getFinalTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-primary"
              onClick={processOrder}
              disabled={!selectedTableId || cart.length === 0 || orderLoading}
            >
              <Receipt className="mr-2 h-5 w-5" />
              {orderLoading ? "Processing..." : "Process Order"}
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
                <p className="text-2xl font-bold">
                  ${getFinalTotal().toFixed(2)}
                </p>
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
