import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { PurchaseOrder, Supplier, InventoryItem } from "@/types/restaurant";
import { PurchaseOrderForm } from "@/components/inventory/PurchaseOrderForm";

const PurchaseOrders: React.FC = () => {
  const { data: orders, execute: fetchOrders } =
    useApi<ApiResponse<PurchaseOrder[]>>();
  const { data: suppliers, execute: fetchSuppliers } =
    useApi<ApiResponse<Supplier[]>>();
  const { data: items, execute: fetchItems } =
    useApi<ApiResponse<InventoryItem[]>>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchOrders(apiService.getPurchaseOrders);
    fetchSuppliers(apiService.getSuppliers);
    fetchItems(apiService.getInventory);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>
      </div>
      <PurchaseOrderForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchOrders}
        suppliers={suppliers?.data || []}
        inventoryItems={items?.data || []}
      />
      {/* ... UI to display purchase orders ... */}
    </div>
  );
};

export default PurchaseOrders;
