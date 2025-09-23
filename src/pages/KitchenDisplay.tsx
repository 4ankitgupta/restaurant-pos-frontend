import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ChefHat,
  Users,
  Timer,
  RefreshCw
} from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { apiService } from '@/services/apiService';
import { toast } from '@/hooks/use-toast';
import { APIOrder } from '@/types/restaurant';

const KitchenDisplay: React.FC = () => {
  const { orders, isConnected } = useWebSocket();
  
  // Filter orders for kitchen display - show ORDERED and PREPARING orders
  const kitchenOrders = orders.filter(order => 
    order.status === 'ORDERED' || order.status === 'PREPARING'
  );

  const markOrderAsStatus = async (orderId: string, status: 'PREPARING' | 'PREPARED') => {
    try {
      await apiService.updateOrderStatus(orderId, status);
      
      toast({
        title: "Success",
        description: `Order marked as ${status.toLowerCase()} successfully`,
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

  const getTimeSinceOrder = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60));
    return minutes;
  };

  const getOrderPriority = (createdAt: string) => {
    const minutes = getTimeSinceOrder(createdAt);
    if (minutes > 12) return 'urgent';
    if (minutes > 8) return 'high';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-destructive bg-destructive/5';
      case 'high': return 'border-l-warning bg-warning/5';
      default: return 'border-l-primary bg-primary/5';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-primary" />
          Kitchen Display System
        </h1>
        <div className="flex items-center space-x-6">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{kitchenOrders.length}</div>
            <div className="text-sm text-muted-foreground">Active Orders</div>
          </div>
        </div>
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">No active orders</p>
          <p className="text-sm text-muted-foreground">Orders will appear here when they're ready for preparation</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {kitchenOrders.map((order) => {
            const priority = getOrderPriority(order.createdAt);
            const timeSince = getTimeSinceOrder(order.createdAt);
            
            return (
              <Card key={order.id} className={`border-l-4 ${getPriorityColor(priority)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Order #{order.id.slice(-6)}
                      {priority === 'urgent' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>{timeSince}m</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Table {order.tableId || 'N/A'}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.menuItem.name}</div>
                          <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                        </div>
                        <Badge className={order.status === 'PREPARING' ? 'bg-warning text-warning-foreground' : 'bg-secondary'}>
                          {order.status === 'ORDERED' ? 'New' : 'Preparing'}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Order Actions */}
                  <div className="pt-3 border-t space-y-2">
                    {order.status === 'ORDERED' && (
                      <Button 
                        onClick={() => markOrderAsStatus(order.id, 'PREPARING')}
                        className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                        size="lg"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Mark as Preparing
                      </Button>
                    )}
                    
                    {order.status === 'PREPARING' && (
                      <Button 
                        onClick={() => markOrderAsStatus(order.id, 'PREPARED')}
                        className="w-full bg-gradient-primary"
                        size="lg"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Prepared
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;