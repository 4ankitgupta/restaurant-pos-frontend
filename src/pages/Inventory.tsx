// src/pages/Inventory.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { apiService, ApiResponse } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { InventoryItem } from "@/types/restaurant";
import { InventoryItemForm } from "@/components/inventory/InventoryItemForm";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";
import { Skeleton } from "@/components/ui/skeleton";

const Inventory: React.FC = () => {
  const { loading, execute: executeGet } =
    useApi<ApiResponse<InventoryItem[]>>();
  const { loading: deleteLoading, execute: executeDelete } = useApi();

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isAdjustmentFormOpen, setIsAdjustmentFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    try {
      const response = await executeGet(() => apiService.getInventory());
      if (response) {
        setInventoryItems(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDeleteItem = async (itemId: string) => {
    try {
      await executeDelete(() => apiService.deleteInventoryItem(itemId));
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
      fetchInventory();
    } catch (error) {
      console.error("Failed to delete inventory item:", error);
    }
  };

  const startEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsItemFormOpen(true);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return "out-of-stock";
    if (item.currentStock <= item.reorderLevel) return "low-stock";
    return "in-stock";
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case "out-of-stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      case "low-stock":
        return (
          <Badge variant="destructive" className="bg-yellow-500 text-white">
            Low Stock
          </Badge>
        );
      case "in-stock":
        return <Badge variant="default">In Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const lowStockItemsCount = inventoryItems.filter(
    (item) =>
      getStockStatus(item) === "low-stock" ||
      getStockStatus(item) === "out-of-stock"
  ).length;

  const totalItems = inventoryItems.length;
  const isLoading = loading || deleteLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAdjustmentFormOpen(true)}
          >
            Adjust Quantity
          </Button>
          <Button onClick={() => setIsItemFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <InventoryItemForm
        open={isItemFormOpen}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
          setIsItemFormOpen(open);
        }}
        onSuccess={fetchInventory}
        editingItem={editingItem}
      />

      <StockAdjustmentForm
        open={isAdjustmentFormOpen}
        onOpenChange={setIsAdjustmentFormOpen}
        onSuccess={fetchInventory}
        items={inventoryItems}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                lowStockItemsCount > 0 ? "text-destructive" : ""
              }`}
            >
              {lowStockItemsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          : inventoryItems.map((item) => {
              const status = getStockStatus(item);
              return (
                <Card
                  key={item.id}
                  className={
                    status.includes("stock") ? "border-destructive" : ""
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Inventory Item
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {getStockBadge(status)}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Current Stock:</span>
                        <span className="font-bold">
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Re-order at:</span>
                        <span className="font-medium">
                          {item.reorderLevel} {item.unit}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {!isLoading && inventoryItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Inventory Items</h3>
            <p className="text-muted-foreground">
              Add your first inventory item to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Inventory;
