import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Mail, Phone, User, Building } from "lucide-react";
import { apiService, ApiResponse } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { Supplier } from "@/types/restaurant";
import { SupplierForm } from "@/components/inventory/SupplierForm";
import { toast } from "@/hooks/use-toast";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useRefresh } from "@/contexts/RefreshContext";

const Suppliers: React.FC = () => {
  const { loading, execute: fetchSuppliersApi } =
    useApi<ApiResponse<Supplier[]>>();
  const { loading: deleteLoading, execute: deleteSupplierApi } = useApi();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { refreshKey } = useRefresh();

  const fetchSuppliers = () => {
    fetchSuppliersApi(() => apiService.getSuppliers())
      .then((response) => {
        if (response?.data) {
          setSuppliers(response.data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch suppliers:", error);
        toast({
          title: "Error",
          description: "Could not fetch suppliers.",
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    fetchSuppliers();
  }, [refreshKey]);

  const handleAddClick = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDelete = async (supplierId: string) => {
    try {
      await deleteSupplierApi(() => apiService.deleteSupplier(supplierId));
      toast({
        title: "Success",
        description: "Supplier deleted successfully.",
      });
      fetchSuppliers(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Suppliers Management</h1>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <SupplierForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchSuppliers}
        editingSupplier={editingSupplier}
        setEditingSupplier={setEditingSupplier}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : suppliers.length > 0 ? (
          suppliers.map((supplier) => (
            <Card key={supplier.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    {supplier.name}
                  </CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditClick(supplier)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the supplier "{supplier.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(supplier.id)}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm">
                {supplier.contactPerson && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4 mt-1" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No suppliers found. Click "Add Supplier" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;
