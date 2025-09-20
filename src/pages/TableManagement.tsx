import React, { useState } from 'react';
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
import { Table } from '@/types/restaurant';

const TableManagement: React.FC = () => {
  // Mock table data
  const [tables, setTables] = useState<Table[]>([
    { id: '1', number: 1, capacity: 2, status: 'available' },
    { id: '2', number: 2, capacity: 4, status: 'occupied', 
      currentOrder: { id: 'ORD001', items: [], status: 'preparing', total: 45.99, createdAt: new Date(), updatedAt: new Date() }
    },
    { id: '3', number: 3, capacity: 4, status: 'occupied', 
      currentOrder: { id: 'ORD002', items: [], status: 'served', total: 78.50, createdAt: new Date(), updatedAt: new Date() }
    },
    { id: '4', number: 4, capacity: 6, status: 'reserved' },
    { id: '5', number: 5, capacity: 2, status: 'occupied', 
      currentOrder: { id: 'ORD003', items: [], status: 'pending', total: 32.75, createdAt: new Date(), updatedAt: new Date() }
    },
    { id: '6', number: 6, capacity: 4, status: 'needs-cleaning' },
    { id: '7', number: 7, capacity: 8, status: 'available' },
    { id: '8', number: 8, capacity: 4, status: 'occupied', 
      currentOrder: { id: 'ORD004', items: [], status: 'ready', total: 125.99, createdAt: new Date(), updatedAt: new Date() }
    },
  ]);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success text-success-foreground';
      case 'occupied': return 'bg-warning text-warning-foreground';
      case 'reserved': return 'bg-secondary text-secondary-foreground';
      case 'needs-cleaning': return 'bg-destructive text-destructive-foreground';
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
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <Users className="h-4 w-4" />;
      case 'reserved': return <Clock className="h-4 w-4" />;
      case 'needs-cleaning': return <AlertCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const updateTableStatus = (tableId: string, newStatus: Table['status']) => {
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: newStatus, currentOrder: newStatus === 'available' ? undefined : table.currentOrder }
        : table
    ));
    setSelectedTable(null);
  };

  const seatCustomers = (tableId: string) => {
    if (!customerName || !partySize) return;
    
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: 'occupied' }
        : table
    ));
    
    setCustomerName('');
    setPartySize('');
    setSelectedTable(null);
  };

  const availableTables = tables.filter(table => table.status === 'available').length;
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const totalRevenue = tables
    .filter(table => table.currentOrder)
    .reduce((sum, table) => sum + (table.currentOrder?.total || 0), 0);

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
            <div className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Active Revenue</div>
          </div>
        </div>
      </div>

      {/* Table Grid */}
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
                <CardTitle className="text-lg">Table {table.number}</CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {getStatusIcon(table.status)}
                  <span className="ml-1 capitalize">{table.status}</span>
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Capacity: {table.capacity} people
              </div>
            </CardHeader>
            
            <CardContent>
              {table.currentOrder ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Order: {table.currentOrder.id}</span>
                    <span className={`text-sm font-medium capitalize ${getOrderStatusColor(table.currentOrder.status)}`}>
                      {table.currentOrder.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="text-sm font-medium">${table.currentOrder.total}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {table.status === 'available' ? 'Ready for guests' : 
                   table.status === 'reserved' ? 'Reserved for later' : 
                   'Needs attention'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Table Actions */}
      {selectedTable && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Table {selectedTable.number} Actions</CardTitle>
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
                      <span className="ml-1 capitalize">{selectedTable.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Capacity: {selectedTable.capacity} people
                  </p>
                  {selectedTable.currentOrder && (
                    <div className="text-sm">
                      <p>Order: {selectedTable.currentOrder.id}</p>
                      <p>Total: ${selectedTable.currentOrder.total}</p>
                      <p className={`capitalize ${getOrderStatusColor(selectedTable.currentOrder.status)}`}>
                        Status: {selectedTable.currentOrder.status}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                
                {selectedTable.status === 'available' && (
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
                  {selectedTable.status === 'occupied' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => updateTableStatus(selectedTable.id, 'needs-cleaning')}
                      >
                        Mark for Cleaning
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => updateTableStatus(selectedTable.id, 'available')}
                      >
                        Clear Table
                      </Button>
                    </>
                  )}
                  
                  {selectedTable.status === 'needs-cleaning' && (
                    <Button
                      variant="success"
                      onClick={() => updateTableStatus(selectedTable.id, 'available')}
                      className="col-span-2"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Clean
                    </Button>
                  )}
                  
                  {selectedTable.status === 'available' && (
                    <Button
                      variant="secondary"
                      onClick={() => updateTableStatus(selectedTable.id, 'reserved')}
                      className="col-span-2"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Reserve Table
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