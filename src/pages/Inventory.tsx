import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Package, TrendingDown, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { apiService } from '@/services/apiService';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  threshold: number;
}

const Inventory: React.FC = () => {
  const { loading, error, execute } = useApi<{ data: InventoryItem[] }>();
  const { loading: createLoading, execute: executeCreate } = useApi();
  const { loading: updateLoading, execute: executeUpdate } = useApi();
  const { loading: deleteLoading, execute: executeDelete } = useApi();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    unit: '',
    quantity: '',
    threshold: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

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

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await executeCreate(() => 
        apiService.createInventoryItem({
          name: itemForm.name,
          unit: itemForm.unit,
          quantity: parseInt(itemForm.quantity),
          threshold: parseInt(itemForm.threshold)
        })
      );
      toast({ title: "Success", description: "Inventory item created successfully" });
      setItemForm({ name: '', unit: '', quantity: '', threshold: '' });
      setIsAddItemOpen(false);
      fetchInventory();
    } catch (error) {
      console.error('Failed to create inventory item:', error);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    try {
      await executeUpdate(() => 
        apiService.updateInventoryItem(editingItem.id, {
          name: itemForm.name,
          unit: itemForm.unit,
          quantity: parseInt(itemForm.quantity),
          threshold: parseInt(itemForm.threshold)
        })
      );
      toast({ title: "Success", description: "Inventory item updated successfully" });
      setEditingItem(null);
      setItemForm({ name: '', unit: '', quantity: '', threshold: '' });
      fetchInventory();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await executeDelete(() => apiService.deleteInventoryItem(itemId));
      toast({ title: "Success", description: "Inventory item deleted successfully" });
      fetchInventory();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
    }
  };

  const startEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity.toString(),
      threshold: item.threshold.toString()
    });
  };

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

  const isFormLoading = createLoading || updateLoading || deleteLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Dialog open={isAddItemOpen || !!editingItem} onOpenChange={(open) => {
          if (!open) {
            setIsAddItemOpen(false);
            setEditingItem(null);
            setItemForm({ name: '', unit: '', quantity: '', threshold: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
              <div>
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="item-unit">Unit</Label>
                <Input
                  id="item-unit"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g., kg, pieces, liters"
                  required
                />
              </div>
              <div>
                <Label htmlFor="item-quantity">Quantity</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="item-threshold">Low Stock Threshold</Label>
                <Input
                  id="item-threshold"
                  type="number"
                  value={itemForm.threshold}
                  onChange={(e) => setItemForm(prev => ({ ...prev, threshold: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={isFormLoading}>
                {editingItem ? 'Update Item' : 'Create Item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  <div className="flex items-center space-x-1">
                    {getStockIcon(status)}
                    <Button variant="ghost" size="sm" onClick={() => startEditItem(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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