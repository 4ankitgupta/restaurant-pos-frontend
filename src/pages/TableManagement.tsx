import React, { useState, useEffect, useMemo } from "react";
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
  Search, // Added icon
} from "lucide-react";
import { Input } from "@/components/ui/input"; // Added import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Added imports
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

// --- NEW: Constant for filter options ---
const STATUS_OPTIONS: (APITable["status"] | "all")[] = [
  "all",
  "Available",
  "Occupied",
  "Reserved",
  "NeedCleaning",
];

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

  // --- NEW: State for Search and Filter ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<APITable["status"] | "all">(
    "all"
  );

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
        // Light green background, dark green text
        return "bg-green-50 border-green-300 text-green-800 hover:bg-green-100";
      case "Occupied":
        // Light red background, dark red text
        return "bg-red-50 border-red-300 text-red-800 hover:bg-red-100";
      case "Reserved":
        // Light blue background, dark blue text
        return "bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100";
      case "NeedCleaning":
        // Light yellow background, dark yellow text
        return "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100";
      default:
        // A neutral default
        return "bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100";
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

  // --- NEW: Memoized array for sorting and filtering ---
  const filteredAndSortedTables = useMemo(() => {
    return tables
      .filter((table) => {
        // Status Filter
        if (statusFilter !== "all" && table.status !== statusFilter) {
          return false;
        }
        // Search Filter (by table number)
        if (
          searchTerm &&
          !table.tableNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Natural sort for strings like "T1", "T2", "T10"
        return a.tableNumber.localeCompare(b.tableNumber, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });
  }, [tables, statusFilter, searchTerm]);

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

      {/* --- NEW: Search and Filter UI --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search Bar */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by table number..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as APITable["status"] | "all")
          }
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status === "all"
                  ? "All Statuses"
                  : status === "NeedCleaning"
                  ? "Cleaning"
                  : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="p-3 pb-2">
                <div className="h-4 bg-muted rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="h-5 bg-muted rounded mb-1"></div>
                <div className="h-4 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // --- MODIFIED: Map over filteredAndSortedTables ---
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredAndSortedTables.map((table) => (
            <Card
              key={table.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2 relative",
                getStatusColor(table.status),
                selectedTable?.id === table.id ? "ring-2 ring-primary" : ""
              )}
              onClick={() => {
                setSelectedTable(table);
                setIsSheetOpen(true);
              }}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-bold truncate">
                      T{table.tableNumber}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Users className="h-3 w-3 shrink-0" />
                      <span>{table.capacity}</span>
                    </div>
                  </div>
                  {canManageTables && (
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEditTable(table);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Trash2 className="h-3 w-3" />
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
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="space-y-1.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "w-full justify-center text-xs py-0.5",
                      getStatusColor(table.status)
                    )}
                  >
                    {getStatusIcon(table.status)}
                    <span className="ml-1 capitalize text-[10px]">
                      {table.status === "NeedCleaning"
                        ? "Cleaning"
                        : table.status}
                    </span>
                  </Badge>

                  {table.status === "Occupied" && table.orderStatus && (
                    <Badge
                      variant="outline"
                      className="w-full justify-center text-[10px] py-0.5"
                    >
                      <BookOpen className="h-2.5 w-2.5 mr-1" />
                      {table.orderStatus.replace("_", " ")}
                    </Badge>
                  )}

                  {table.status === "Occupied" &&
                    (() => {
                      const tableOrder = orders.find(
                        (order) => order.tableId === table.id
                      );
                      // Removed payment status badge display per request
                      return null;
                    })()}
                </div>
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
