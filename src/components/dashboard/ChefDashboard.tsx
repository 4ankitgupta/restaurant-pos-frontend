import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChefDashboard: React.FC = () => {
  // Mock data
  const kitchenStats = {
    activeOrders: 7,
    completedToday: 45,
    averagePrepTime: '12:30',
    urgentOrders: 2
  };

  const activeOrders = [
    { id: 'ORD001', table: 5, items: ['Margherita Pizza', 'Caesar Salad'], time: '8:45', priority: 'urgent' },
    { id: 'ORD002', table: 3, items: ['Beef Burger', 'Fries', 'Coke'], time: '5:20', priority: 'normal' },
    { id: 'ORD003', table: 8, items: ['Pasta Carbonara'], time: '3:15', priority: 'normal' },
    { id: 'ORD004', table: 12, items: ['Grilled Chicken', 'Vegetables'], time: '10:30', priority: 'urgent' },
  ];

  const completedOrders = [
    { id: 'ORD020', table: 7, items: 3, completedAt: '2 min ago' },
    { id: 'ORD019', table: 4, items: 2, completedAt: '5 min ago' },
    { id: 'ORD018', table: 9, items: 1, completedAt: '8 min ago' },
  ];

  const getPriorityColor = (priority: string) => {
    return priority === 'urgent' 
      ? 'border-l-destructive bg-destructive/5' 
      : 'border-l-primary bg-primary/5';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Kitchen Dashboard</h1>
        <Button asChild size="lg" className="bg-gradient-primary">
          <Link to="/kitchen">
            <ChefHat className="mr-2 h-5 w-5" />
            Kitchen Display
          </Link>
        </Button>
      </div>

      {/* Kitchen Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{kitchenStats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">In preparation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{kitchenStats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Orders finished</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Prep Time</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{kitchenStats.averagePrepTime}</div>
            <p className="text-xs text-muted-foreground">Order to ready</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{kitchenStats.urgentOrders}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeOrders.map((order) => (
              <div key={order.id} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(order.priority)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{order.id}</span>
                    <span className="text-sm text-muted-foreground">• Table {order.table}</span>
                    {order.priority === 'urgent' && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-warning">{order.time}</span>
                </div>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm text-muted-foreground">• {item}</div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recently Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Recently Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <div>
                    <span className="font-medium">{order.id}</span>
                    <span className="text-sm text-muted-foreground ml-2">• Table {order.table}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{order.items} items</div>
                  <div className="text-xs text-muted-foreground">{order.completedAt}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button asChild variant="outline" className="h-16 flex-col">
          <Link to="/kitchen">
            <ChefHat className="h-6 w-6 mb-2" />
            <span>Full Kitchen View</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-16 flex-col">
          <Link to="/inventory">
            <AlertTriangle className="h-6 w-6 mb-2" />
            <span>Check Inventory</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-16 flex-col">
          <Link to="/menu">
            <Clock className="h-6 w-6 mb-2" />
            <span>Menu Status</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-16 flex-col">
          <Link to="/reports">
            <CheckCircle className="h-6 w-6 mb-2" />
            <span>Kitchen Report</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};