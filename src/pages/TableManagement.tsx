import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Clock, 
  Plus, 
  Edit, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { apiService } from '@/services/apiService';
import { useApi } from '@/hooks/useApi';

interface APITable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved';
  restaurantId: string;
}

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<APITable[]>([]);
  const { loading, error, execute } = useApi<{ data: APITable[] }>();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await execute(() => apiService.getTables());
        if (response) {
          setTables(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      }
    };

    fetchTables();
  }, [execute]);

  const [selectedTable, setSelectedTable] = useState<APITable | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState('');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'bg-success text-success-foreground';
      case 'occupied': return 'bg-warning text-warning-foreground';
      case 'reserved': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-warning';
      case 'preparing': return 'text-secondary';
      case 'ready': return 'text-success';
      case 'served': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <Users className="h-4 w-4" />;
      case 'reserved': return <Clock className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const updateTableStatus = (tableId: string, newStatus: APITable['status']) => {
    // In a real app, this would make an API call
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: newStatus }
        : table
    ));
    setSelectedTable(null);
  };

  const seatCustomers = (tableId: string) => {
    if (!customerName || !partySize) return;
    
    // In a real app, this would make an API call
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: 'Occupied' }
        : table
    ));
    
    setCustomerName('');
    setPartySize('');
    setSelectedTable(null);
  };

  const availableTables = tables.filter(table => table.status === 'Available').length;
  const occupiedTables = tables.filter(table => table.status === 'Occupied').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Table Management</h1>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{availableTables}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{occupiedTables}</div>
            <div className="text-sm text-muted-foreground">Occupied</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{tables.length}</div>
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
                selectedTable?.id === table.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTable(table)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Table {table.tableNumber}</CardTitle>
                  <Badge className={getStatusColor(table.status)}>
                    {getStatusIcon(table.status)}
                    <span className="ml-1 capitalize">{table.status.toLowerCase()}</span>
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Capacity: {table.capacity} people
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {table.status === 'Available' ? 'Ready for guests' : 
                   table.status === 'Reserved' ? 'Reserved for later' : 
                   'Currently occupied'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Table Actions */}
      {selectedTable && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Table {selectedTable.tableNumber} Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Status */}
              <div>
                <h3 className="font-semibold mb-3">Current Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedTable.status)}>
                      {getStatusIcon(selectedTable.status)}
                      <span className="ml-1 capitalize">{selectedTable.status.toLowerCase()}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Capacity: {selectedTable.capacity} people
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                
                {selectedTable.status === 'Available' && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Party size"
                      type="number"
                      value={partySize}
                      onChange={(e) => setPartySize(e.target.value)}
                    />
                    <Button 
                      onClick={() => seatCustomers(selectedTable.id)}
                      disabled={!customerName || !partySize}
                      className="w-full"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Seat Customers
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {selectedTable.status === 'Occupied' && (
                    <Button
                      variant="success"
                      onClick={() => updateTableStatus(selectedTable.id, 'Available')}
                      className="col-span-2"
                    >
                      Clear Table
                    </Button>
                  )}
                  
                  {selectedTable.status === 'Available' && (
                    <Button
                      variant="secondary"
                      onClick={() => updateTableStatus(selectedTable.id, 'Reserved')}
                      className="col-span-2"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Reserve Table
                    </Button>
                  )}
                  
                  {selectedTable.status === 'Reserved' && (
                    <Button
                      variant="success"
                      onClick={() => updateTableStatus(selectedTable.id, 'Available')}
                      className="col-span-2"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Make Available
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TableManagement;