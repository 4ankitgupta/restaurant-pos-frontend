import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { useApi } from '@/hooks/useApi';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  threshold: number;
}

const Inventory: React.FC = () => {
  const { loading, error, execute } = useApi<{ data: InventoryItem[] }>();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await execute(() => apiService.getInventory());
        if (response) {
          setInventoryItems(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    };

    fetchInventory();
  }, [execute]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return 'out-of-stock';
    if (item.quantity <= item.threshold) return 'low-stock';
    if (item.quantity > item.threshold * 2) return 'overstocked';
    return 'in-stock';
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'out-of-stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'low-stock':
        return <Badge variant="destructive">Low Stock</Badge>;
      case 'overstocked':
        return <Badge variant="secondary">Overstocked</Badge>;
      case 'in-stock':
        return <Badge variant="default">In Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'out-of-stock':
      case 'low-stock':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'overstocked':
        return <TrendingUp className="h-4 w-4 text-secondary" />;
      case 'in-stock':
        return <TrendingUp className="h-4 w-4 text-success" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const lowStockItems = inventoryItems.filter(item => 
    getStockStatus(item) === 'low-stock' || getStockStatus(item) === 'out-of-stock'
  ).length;

  const totalItems = inventoryItems.length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalItems}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{lowStockItems}</div>
            <div className="text-sm text-muted-foreground">Low Stock</div>
          </div>
        </div>
      </div>

      {/* Alerts for low stock items */}
      {lowStockItems > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {lowStockItems} item{lowStockItems > 1 ? 's' : ''} require immediate attention due to low or zero stock levels.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {inventoryItems.map((item) => {
          const status = getStockStatus(item);
          return (
            <Card key={item.id} className={`${
              status === 'out-of-stock' || status === 'low-stock' 
                ? 'border-destructive' 
                : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  {getStockIcon(status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unit: {item.unit}</span>
                  {getStockBadge(status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Stock:</span>
                    <span className={`text-lg font-bold ${
                      status === 'out-of-stock' || status === 'low-stock'
                        ? 'text-destructive'
                        : 'text-primary'
                    }`}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Threshold:</span>
                    <span className="text-sm font-medium">{item.threshold}</span>
                  </div>
                  
                  {/* Stock level progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'out-of-stock' 
                            ? 'bg-destructive' 
                            : status === 'low-stock'
                            ? 'bg-warning'
                            : 'bg-success'
                        }`}
                        style={{ 
                          width: `${Math.min(100, Math.max(5, (item.quantity / (item.threshold * 2)) * 100))}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {inventoryItems.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Inventory Items</h3>
            <p className="text-muted-foreground">
              No inventory items found. Items will appear here once they are added to the system.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Inventory;