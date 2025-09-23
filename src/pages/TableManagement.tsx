import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { APITable, APIOrder } from "@/types/restaurant";

const TableManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useWebSocket();
  const [tables, setTables] = useState<APITable[]>([]);
  const {
    loading,
    error,
    execute: fetchTables,
  } = useApi<{ data: APITable[] }>();
  const { execute: getActiveOrder } = useApi<{ data: APIOrder }>();
  const { execute: executeTableAction } = useApi();

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
  }, []);

  const [selectedTable, setSelectedTable] = useState<APITable | null>(null);
  const [partySize, setPartySize] = useState("");

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
    } catch (error) {
      console.error("Failed to update table status:", error);
    }
  };

  const handleSeatCustomers = async () => {
    if (!selectedTable || !partySize) return;

    try {
      await executeTableAction(() =>
        apiService.seatTable(selectedTable.id, parseInt(partySize))
      );
      await loadTables(); // Refresh tables to show new status
      setPartySize("");
      setSelectedTable(null); // Deselect table
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
              items: []
            })
          );
          
          if (createOrderResponse && (createOrderResponse as any)?.data) {
            navigate("/pos", {
              state: { orderId: (createOrderResponse as any).data.id, tableId: tableId },
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
      const fallbackRoute = (user?.role === "cashier" || user?.role === "admin") ? "/pos" : "/waiter-order";
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Table Management</h1>
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

      {/* Table Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedTable?.id === table.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedTable(table)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Table {table.tableNumber}
                  </CardTitle>
                  <Badge className={getStatusColor(table.status)}>
                    {getStatusIcon(table.status)}
                    <span className="ml-1 capitalize">
                      {table.status.toLowerCase()}
                    </span>
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Capacity: {table.capacity} people
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
                
                {/* Show payment status for occupied tables */}
                {table.status === "Occupied" && (() => {
                  const tableOrder = orders.find(order => order.tableId === table.id);
                  return tableOrder ? (
                    <div className="flex items-center gap-2 mt-2">
                      <DollarSign className="h-4 w-4" />
                      <Badge className={
                        tableOrder.paymentStatus === 'UNPAID' ? 'bg-destructive text-destructive-foreground' :
                        tableOrder.paymentStatus === 'PARTIAL' ? 'bg-warning text-warning-foreground' :
                        'bg-success text-success-foreground'
                      }>
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

      {/* Selected Table Actions */}
      {selectedTable && (
        <Card className="mt-6">
          {/* ... (Card Header is same as before) */}
          <CardContent>
            {/* ... (Current Status is same as before) */}

            {/* --- MODIFIED: Quick Actions section --- */}
            <div>
              <h3 className="font-semibold mb-3">Quick Actions</h3>

              {selectedTable.status === "Available" && (
                <div className="space-y-3">
                  <Input
                    placeholder="Party size"
                    type="number"
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                  />
                  <Button
                    onClick={handleSeatCustomers}
                    disabled={!partySize}
                    className="w-full"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Seat Customers
                  </Button>
                </div>
              )}

              {selectedTable.status === "Occupied" && (
                <div className="space-y-3">
                  <Button
                    onClick={() => handleTakeOrder(selectedTable.id)}
                    className="w-full bg-gradient-primary"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Take / View Order
                  </Button>
                </div>
              )}

              {selectedTable.status === "NeedCleaning" && (
                <div className="space-y-3">
                  <Button
                    onClick={() => handleUpdateStatus(selectedTable.id, "Available")}
                    className="w-full bg-success text-success-foreground"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Clean & Available
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                {selectedTable.status === "Occupied" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleUpdateStatus(selectedTable.id, "NeedCleaning")
                      }
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Mark for Cleaning
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleUpdateStatus(selectedTable.id, "Available")
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Clear Table
                    </Button>
                  </>
                )}

                {selectedTable.status === "Available" && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleUpdateStatus(selectedTable.id, "Reserved")
                    }
                    className="col-span-2"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as Reserved
                  </Button>
                )}

                {selectedTable.status === "Reserved" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleUpdateStatus(selectedTable.id, "Available")
                    }
                    className="col-span-2"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Cancel Reservation
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TableManagement;
