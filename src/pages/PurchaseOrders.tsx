import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Building, Calendar, Package } from "lucide-react";
import { apiService, ApiResponse } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { PurchaseOrder, Supplier, InventoryItem } from "@/types/restaurant";
import { PurchaseOrderForm } from "@/components/inventory/PurchaseOrderForm";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const PurchaseOrders: React.FC = () => {
  const { loading: ordersLoading, execute: fetchOrdersApi } =
    useApi<ApiResponse<PurchaseOrder[]>>();
  const { loading: suppliersLoading, execute: fetchSuppliersApi } =
    useApi<ApiResponse<Supplier[]>>();
  const { loading: itemsLoading, execute: fetchItemsApi } =
    useApi<ApiResponse<InventoryItem[]>>();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchAllData = () => {
    fetchOrdersApi(() => apiService.getPurchaseOrders())
      .then((res) => res && setPurchaseOrders(res.data))
      .catch((err) =>
        toast({
          title: "Error fetching orders",
          description: "Could not fetch purchase orders.",
          variant: "destructive",
        })
      );

    fetchSuppliersApi(() => apiService.getSuppliers())
      .then((res) => res && setSuppliers(res.data))
      .catch((err) =>
        toast({
          title: "Error fetching suppliers",
          description: "Could not fetch suppliers.",
          variant: "destructive",
        })
      );

    fetchItemsApi(() => apiService.getInventory())
      .then((res) => res && setInventoryItems(res.data))
      .catch((err) =>
        toast({
          title: "Error fetching inventory",
          description: "Could not fetch inventory items.",
          variant: "destructive",
        })
      );
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const loading = ordersLoading || suppliersLoading || itemsLoading;

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
        onSuccess={fetchAllData}
        suppliers={suppliers}
        inventoryItems={inventoryItems}
      />

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : purchaseOrders.length > 0 ? (
          purchaseOrders.map((po) => (
            <Card key={po.id}>
              <Accordion type="single" collapsible>
                <AccordionItem value={po.id} className="border-none">
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground w-full">
                      <div className="font-semibold text-foreground">
                        PO #{po.id.substring(0, 8)}...
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" /> {po.supplier.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />{" "}
                        {format(new Date(po.purchaseDate), "PPP")}
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-base text-foreground ml-auto">
                        <div className="text-primary text-xl font-bold">
                          {" "}
                          ₹{" "}
                        </div>
                        {po.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <h4 className="font-semibold mb-2">
                      Items ({po.purchaseItems.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">
                            Total Price
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {po.purchaseItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.inventoryItem.name}</TableCell>
                            <TableCell>
                              {item.quantity} {item.inventoryItem.unit}
                            </TableCell>
                            <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              ₹{item.totalPrice.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No Purchase Orders Found
              </h3>
              <p className="text-muted-foreground">
                Click "New Purchase Order" to create one.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrders;
