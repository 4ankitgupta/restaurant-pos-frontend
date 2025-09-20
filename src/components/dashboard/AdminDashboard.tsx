import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Package,
  BarChart3,
  ChefHat
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  // Mock data - replace with actual API calls
  const salesData = {
    totalSales: 12750,
    ordersCount: 89,
    averageOrderValue: 143.26,
    topItems: [
      { name: 'Margherita Pizza', sales: 34 },
      { name: 'Caesar Salad', sales: 28 },
      { name: 'Beef Burger', sales: 25 },
    ]
  };

  const alerts = [
    { id: 1, message: 'Low stock: Tomatoes (5 kg left)', type: 'warning' },
    { id: 2, message: 'New order #1247 waiting', type: 'info' },
    { id: 3, message: 'Table 7 needs cleaning', type: 'warning' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Today • {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${salesData.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{salesData.ordersCount}</div>
            <p className="text-xs text-muted-foreground">+5% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">${salesData.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">+8% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">12/16</div>
            <p className="text-xs text-muted-foreground">75% occupied</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-2 h-2 rounded-full ${
                  alert.type === 'warning' ? 'bg-warning' : 'bg-primary'
                }`} />
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {salesData.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.sales} sold</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link to="/pos">
            <ShoppingCart className="h-6 w-6 mb-2" />
            <span>Open POS</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link to="/kitchen">
            <ChefHat className="h-6 w-6 mb-2" />
            <span>Kitchen Display</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link to="/inventory">
            <Package className="h-6 w-6 mb-2" />
            <span>Inventory</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link to="/reports">
            <BarChart3 className="h-6 w-6 mb-2" />
            <span>Reports</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};