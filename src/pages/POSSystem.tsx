import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Trash2,
  Search
} from 'lucide-react';
import { MenuItem, OrderItem } from '@/types/restaurant';

const POSSystem: React.FC = () => {
  // Mock menu data
  const menuCategories = [
    {
      name: 'Appetizers',
      items: [
        { id: '1', name: 'Caesar Salad', price: 12.99, category: 'Appetizers', available: true },
        { id: '2', name: 'Garlic Bread', price: 8.99, category: 'Appetizers', available: true },
        { id: '3', name: 'Buffalo Wings', price: 14.99, category: 'Appetizers', available: true },
      ]
    },
    {
      name: 'Main Course',
      items: [
        { id: '4', name: 'Margherita Pizza', price: 18.99, category: 'Main Course', available: true },
        { id: '5', name: 'Beef Burger', price: 16.99, category: 'Main Course', available: true },
        { id: '6', name: 'Grilled Chicken', price: 22.99, category: 'Main Course', available: true },
        { id: '7', name: 'Pasta Carbonara', price: 19.99, category: 'Main Course', available: true },
      ]
    },
    {
      name: 'Beverages',
      items: [
        { id: '8', name: 'Coca Cola', price: 3.99, category: 'Beverages', available: true },
        { id: '9', name: 'Fresh Orange Juice', price: 5.99, category: 'Beverages', available: true },
        { id: '10', name: 'Coffee', price: 4.99, category: 'Beverages', available: true },
      ]
    }
  ];

  const [activeCategory, setActiveCategory] = useState('Appetizers');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.menuItem.id === menuItem.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.menuItem.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newOrderItem: OrderItem = {
        id: `${Date.now()}-${menuItem.id}`,
        menuItem,
        quantity: 1,
        status: 'pending'
      };
      setCart([...cart, newOrderItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const getTax = () => {
    return getTotal() * 0.1; // 10% tax
  };

  const getFinalTotal = () => {
    return getTotal() + getTax();
  };

  const currentItems = menuCategories.find(cat => cat.name === activeCategory)?.items || [];
  const filteredItems = currentItems.filter(item => 
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
        <div className="flex space-x-2 mb-6">
          {menuCategories.map((category) => (
            <Button
              key={category.name}
              variant={activeCategory === category.name ? 'pos-selected' : 'pos'}
              onClick={() => setActiveCategory(category.name)}
              className="px-6"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto h-[calc(100vh-250px)]">
          {filteredItems.map((item) => (
            <Button
              key={item.id}
              variant="pos"
              size="pos"
              onClick={() => addToCart(item)}
              className="h-32"
            >
              <div className="w-full">
                <h3 className="font-semibold text-left line-clamp-2">{item.name}</h3>
                <p className="text-primary font-bold text-left mt-2">${item.price}</p>
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

        <div className="mb-4">
          <Input
            placeholder="Table number (optional)"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
          />
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
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                  <p className="text-xs text-muted-foreground">${item.menuItem.price} each</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
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

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex-col h-16">
                <DollarSign className="h-5 w-5 mb-1" />
                <span className="text-xs">Cash</span>
              </Button>
              <Button variant="outline" className="flex-col h-16">
                <CreditCard className="h-5 w-5 mb-1" />
                <span className="text-xs">Card</span>
              </Button>
            </div>

            <Button size="lg" className="w-full bg-gradient-primary">
              <Receipt className="mr-2 h-5 w-5" />
              Process Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSSystem;