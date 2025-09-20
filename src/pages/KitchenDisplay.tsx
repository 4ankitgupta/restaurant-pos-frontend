import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ChefHat,
  Users,
  Timer
} from 'lucide-react';
import { Order, OrderItem } from '@/types/restaurant';

const KitchenDisplay: React.FC = () => {
  // Mock kitchen orders
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD001',
      tableNumber: 5,
      customerName: 'Johnson Party',
      items: [
        { id: '1', menuItem: { id: '4', name: 'Margherita Pizza', price: 18.99, category: 'Main Course', available: true }, quantity: 2, status: 'preparing' },
        { id: '2', menuItem: { id: '1', name: 'Caesar Salad', price: 12.99, category: 'Appetizers', available: true }, quantity: 1, status: 'ready' },
      ],
      status: 'preparing',
      total: 50.97,
      createdAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
      updatedAt: new Date(),
    },
    {
      id: 'ORD002',
      tableNumber: 3,
      customerName: 'Smith Family',
      items: [
        { id: '3', menuItem: { id: '5', name: 'Beef Burger', price: 16.99, category: 'Main Course', available: true }, quantity: 2, status: 'preparing' },
        { id: '4', menuItem: { id: '8', name: 'Coca Cola', price: 3.99, category: 'Beverages', available: true }, quantity: 2, status: 'ready' },
      ],
      status: 'preparing',
      total: 41.96,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      updatedAt: new Date(),
    },
    {
      id: 'ORD003',
      tableNumber: 8,
      customerName: 'Brown Party',
      items: [
        { id: '5', menuItem: { id: '7', name: 'Pasta Carbonara', price: 19.99, category: 'Main Course', available: true }, quantity: 1, status: 'preparing' },
        { id: '6', menuItem: { id: '3', name: 'Buffalo Wings', price: 14.99, category: 'Appetizers', available: true }, quantity: 1, status: 'preparing' },
      ],
      status: 'preparing',
      total: 34.98,
      createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      updatedAt: new Date(),
    },
    {
      id: 'ORD004',
      tableNumber: 12,
      customerName: 'Davis Party',
      items: [
        { id: '7', menuItem: { id: '6', name: 'Grilled Chicken', price: 22.99, category: 'Main Course', available: true }, quantity: 1, status: 'preparing' },
      ],
      status: 'preparing',
      total: 22.99,
      createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago - urgent
      updatedAt: new Date(),
    },
  ]);

  const updateItemStatus = (orderId: string, itemId: string, newStatus: OrderItem['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? {
            ...order,
            items: order.items.map(item => 
              item.id === itemId ? { ...item, status: newStatus } : item
            ),
            updatedAt: new Date()
          }
        : order
    ));
  };

  const markOrderReady = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: 'ready',
            items: order.items.map(item => ({ ...item, status: 'ready' })),
            updatedAt: new Date()
          }
        : order
    ));
  };

  const getTimeSinceOrder = (createdAt: Date) => {
    const minutes = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60));
    return minutes;
  };

  const getOrderPriority = (createdAt: Date) => {
    const minutes = getTimeSinceOrder(createdAt);
    if (minutes > 10) return 'urgent';
    if (minutes > 7) return 'high';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-destructive bg-destructive/5';
      case 'high': return 'border-l-warning bg-warning/5';
      default: return 'border-l-primary bg-primary/5';
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-success text-success-foreground';
      case 'preparing': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const activeOrders = orders.filter(order => order.status === 'preparing');
  const completedOrders = orders.filter(order => order.status === 'ready');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-primary" />
          Kitchen Display System
        </h1>
        <div className="flex space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{activeOrders.length}</div>
            <div className="text-sm text-muted-foreground">Active Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{completedOrders.length}</div>
            <div className="text-sm text-muted-foreground">Ready to Serve</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeOrders.map((order) => {
          const priority = getOrderPriority(order.createdAt);
          const timeSince = getTimeSinceOrder(order.createdAt);
          
          return (
            <Card key={order.id} className={`border-l-4 ${getPriorityColor(priority)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {order.id}
                    {priority === 'urgent' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span>{timeSince}m</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Table {order.tableNumber}</span>
                  {order.customerName && <span>• {order.customerName}</span>}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.menuItem.name}</div>
                        <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground italic">{item.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getItemStatusColor(item.status)}>
                          {item.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{item.status}</span>
                        </Badge>
                        {item.status === 'preparing' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="pt-3 border-t">
                  {order.items.every(item => item.status === 'ready') ? (
                    <Button 
                      onClick={() => markOrderReady(order.id)}
                      className="w-full bg-gradient-primary"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Order Ready
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          order.items.forEach(item => {
                            if (item.status === 'preparing') {
                              updateItemStatus(order.id, item.id, 'ready');
                            }
                          });
                        }}
                      >
                        Ready All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Need Help
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completed Orders Section */}
      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Ready to Serve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-success bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{order.id}</div>
                      <div className="text-sm text-muted-foreground">
                        Table {order.tableNumber} • {order.items.length} items
                      </div>
                    </div>
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;