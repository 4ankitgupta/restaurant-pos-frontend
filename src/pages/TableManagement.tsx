import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { APITable, APIOrder } from "@/types/restaurant";
import { TableSheet } from "@/components/table/TableSheet";
import { useRefresh } from "@/contexts/RefreshContext";
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
import { TableForm, TableFormValues } from "@/components/table/TableForm";
import { cn } from "@/lib/utils";

const TableManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useWebSocket();
  const canManageTables = user?.role === "manager" || user?.role === "admin";
  const [tables, setTables] = useState<APITable[]>([]);
  const {
    loading,
    error,
    execute: fetchTables,
  } = useApi<{ data: APITable[] }>();
  const { execute: getActiveOrder } = useApi<{ data: APIOrder }>();
  const { execute: executeTableAction } = useApi();
  const { execute: saveTableApi, loading: savingTable } = useApi();
  const { execute: deleteTableApi, loading: deletingTable } = useApi();
  const { refreshKey } = useRefresh();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<APITable | null>(null);

  const loadTables = async () => {
    try {
      const response = await fetchTables(() => apiService.getTables());
      if (response) {
        setTables(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    }
  };

  useEffect(() => {
    loadTables();
  }, [refreshKey]);

  const [selectedTable, setSelectedTable] = useState<APITable | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddTable = () => {
    setEditingTable(null);
    setIsFormOpen(true);
    setIsSheetOpen(false);
  };

  const handleEditTable = (table: APITable) => {
    setEditingTable(table);
    setIsFormOpen(true);
    setIsSheetOpen(false);
  };

  const handleFormSubmit = async (values: TableFormValues) => {
    try {
      if (editingTable) {
        await saveTableApi(() =>
          apiService.updateTable(editingTable.id, values)
        );
        toast({
          title: "Table updated",
          description: `Table ${values.tableNumber} updated successfully.`,
        });
      } else {
        await saveTableApi(() => apiService.createTable(values));
        toast({
          title: "Table created",
          description: `Table ${values.tableNumber} created successfully.`,
        });
      }

      await loadTables();
      setSelectedTable(null);
      setIsSheetOpen(false);
      setIsFormOpen(false);
      setEditingTable(null);
    } catch (error) {
      console.error("Failed to save table:", error);
    }
  };

  const handleDeleteTable = async (table: APITable) => {
    try {
      await deleteTableApi(() => apiService.deleteTable(table.id));
      toast({
        title: "Table deleted",
        description: `Table ${table.tableNumber} deleted successfully.`,
      });

      if (selectedTable?.id === table.id) {
        setSelectedTable(null);
        setIsSheetOpen(false);
      }

      await loadTables();
    } catch (error) {
      console.error("Failed to delete table:", error);
    }
  };

  const getStatusColor = (status: APITable["status"]) => {
    switch (status) {
      case "Available":
        return "bg-success text-success-foreground";
      case "Occupied":
        return "bg-warning text-warning-foreground";
      case "Reserved":
        return "bg-secondary text-secondary-foreground";
      case "NeedCleaning":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getOrderStatusColor = (status: APITable["orderStatus"]) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-primary text-primary-foreground"; // Blue for active orders
      case "PENDING":
        return "bg-secondary text-secondary-foreground"; // Gray for pending
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: APITable["status"]) => {
    switch (status) {
      case "Available":
        return <CheckCircle className="h-4 w-4" />;
      case "Occupied":
        return <Users className="h-4 w-4" />;
      case "Reserved":
        return <Clock className="h-4 w-4" />;
      case "NeedCleaning":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const handleUpdateStatus = async (
    tableId: string,
    status: APITable["status"]
  ) => {
    try {
      await executeTableAction(() =>
        apiService.updateTableStatus(tableId, status)
      );
      loadTables();
      setSelectedTable(null);
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Failed to update table status:", error);
    }
  };

  const handleSeatCustomers = async (partySize: number) => {
    if (!selectedTable) return;

    try {
      await executeTableAction(() =>
        apiService.seatTable(selectedTable.id, partySize)
      );
      await loadTables();
      setSelectedTable(null);
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Failed to seat customers:", error);
    }
  };

  // --- MODIFIED: Logic for taking/viewing an order ---
  const handleTakeOrder = async (tableId: string) => {
    try {
      // Navigate to different components based on user role
      if (user?.role === "cashier" || user?.role === "admin") {
        // Cashiers and admins use full POS system
        const response = await getActiveOrder(() =>
          apiService.getActiveOrderForTable(tableId)
        );

        if (response && (response as any)?.data) {
          navigate("/pos", {
            state: { orderId: (response as any).data.id, tableId: tableId },
          });
        } else {
          const createOrderResponse = await executeTableAction(() =>
            apiService.createOrder({
              tableId: tableId,
              items: [],
            })
          );

          if (createOrderResponse && (createOrderResponse as any)?.data) {
            navigate("/pos", {
              state: {
                orderId: (createOrderResponse as any).data.id,
                tableId: tableId,
              },
            });
          }
        }
      } else {
        // Waiters use simplified order management
        const response = await getActiveOrder(() =>
          apiService.getActiveOrderForTable(tableId)
        );

        if (response && (response as any)?.data) {
          navigate("/waiter-order", {
            state: { orderId: (response as any).data.id, tableId: tableId },
          });
        } else {
          navigate("/waiter-order", {
            state: { tableId: tableId },
          });
        }
      }
    } catch (error) {
      console.error("Failed to handle order for table:", error);
      // Fallback navigation based on role
      const fallbackRoute =
        user?.role === "cashier" || user?.role === "admin"
          ? "/pos"
          : "/waiter-order";
      navigate(fallbackRoute, {
        state: { tableId: tableId },
      });
    }
  };
  const availableTables = tables.filter(
    (table) => table.status === "Available"
  ).length;
  const occupiedTables = tables.filter(
    (table) => table.status === "Occupied"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-3xl font-bold">Table Management</h1>
          {canManageTables && (
            <Button onClick={handleAddTable} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          )}
        </div>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {availableTables}
            </div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {occupiedTables}
            </div>
            <div className="text-sm text-muted-foreground">Occupied</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {tables.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Tables</div>
          </div>
        </div>
      </div>

      <TableForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        loading={savingTable}
        editingTable={editingTable}
        setEditingTable={setEditingTable}
      />

      {/* Table Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={cn(
                "flex h-full cursor-pointer flex-col transition-all hover:shadow-lg",
                selectedTable?.id === table.id ? "ring-2 ring-primary" : ""
              )}
              onClick={() => {
                setSelectedTable(table);
                setIsSheetOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-base md:text-lg">
                      Table {table.tableNumber}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Capacity: {table.capacity} people
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge className={getStatusColor(table.status)}>
                      {getStatusIcon(table.status)}
                      <span className="ml-1 capitalize">
                        {table.status.toLowerCase()}
                      </span>
                    </Badge>
                    {canManageTables && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditTable(table);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive sm:h-9 sm:w-9"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Table {table.tableNumber}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently remove the table and its allocation
                                settings.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTable(table)}
                                disabled={deletingTable}
                              >
                                {deletingTable ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {table.status === "Available"
                    ? "Ready for guests"
                    : table.status === "Reserved"
                    ? "Reserved for later"
                    : table.status === "NeedCleaning"
                    ? "Needs cleaning"
                    : "Currently occupied"}
                </div>

                {/* --- ADD THIS BLOCK to show order status --- */}
                {table.status === "Occupied" && table.orderStatus && (
                  <div className="flex items-center gap-2 mt-2">
                    <BookOpen className="h-4 w-4" />
                    <Badge className={getOrderStatusColor(table.orderStatus)}>
                      {table.orderStatus}
                    </Badge>
                  </div>
                )}

                {/* Show payment status for occupied tables */}
                {table.status === "Occupied" &&
                  (() => {
                    const tableOrder = orders.find(
                      (order) => order.tableId === table.id
                    );
                    return tableOrder ? (
                      <div className="flex items-center gap-2 mt-2">
                        {/* <DollarSign className="h-4 w-4" /> */}
                        <div className="text-xl font-semibold">₹</div>
                        <Badge
                          className={
                            tableOrder.paymentStatus === "UNPAID"
                              ? "bg-destructive text-destructive-foreground"
                              : tableOrder.paymentStatus === "PARTIAL"
                              ? "bg-warning text-warning-foreground"
                              : "bg-success text-success-foreground"
                          }
                        >
                          {tableOrder.paymentStatus}
                        </Badge>
                      </div>
                    ) : null;
                  })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table Sheet for Actions */}
      <TableSheet
        table={selectedTable}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSeatCustomers={handleSeatCustomers}
        onTakeOrder={handleTakeOrder}
        onUpdateStatus={handleUpdateStatus}
        orders={orders}
      />
    </div>
  );
};

export default TableManagement;
