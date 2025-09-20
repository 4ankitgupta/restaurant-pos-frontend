import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Clock, DollarSign, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CashierDashboard: React.FC = () => {
  // Mock data
  const todayStats = {
    ordersProcessed: 23,
    totalSales: 2847,
    averageOrderTime: '3:45',
    pendingOrders: 4
  };

  const recentOrders = [
    { id: 'ORD001', table: '5', amount: 78.50, status: 'completed', time: '2 min ago' },
    { id: 'ORD002', table: '3', amount: 125.75, status: 'pending', time: '5 min ago' },
    { id: 'ORD003', table: '8', amount: 89.25, status: 'completed', time: '8 min ago' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Cashier Dashboard</h1>
        <Button asChild size="lg" className="bg-gradient-primary">
          <Link to="/pos">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Open POS
          </Link>
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todayStats.ordersProcessed}</div>
            <p className="text-xs text-muted-foreground">Your shift today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${todayStats.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Your transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Time</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{todayStats.averageOrderTime}</div>
            <p className="text-xs text-muted-foreground">Processing time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{todayStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-fast">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{order.id}</span>
                    <span className="text-xs text-muted-foreground">Table {order.table}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {order.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${order.amount}</div>
                  <div className="text-xs text-muted-foreground">{order.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button asChild variant="outline" className="h-16 flex-col">
          <Link to="/pos">
            <ShoppingCart className="h-6 w-6 mb-2" />
            <span>New Order</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-16 flex-col">
          <Link to="/tables">
            <Receipt className="h-6 w-6 mb-2" />
            <span>View Tables</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-16 flex-col">
          <Link to="/reports">
            <DollarSign className="h-6 w-6 mb-2" />
            <span>Daily Report</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};