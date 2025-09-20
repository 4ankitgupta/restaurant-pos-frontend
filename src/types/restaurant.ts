export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface Order {
  id: string;
  tableNumber?: number;
  customerName?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
  total: number;
  createdAt: Date;
  updatedAt: Date;
  waiterId?: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'needs-cleaning';
  currentOrder?: Order;
  x?: number;
  y?: number;
}

export interface SalesData {
  totalSales: number;
  ordersCount: number;
  averageOrderValue: number;
  topItems: Array<{ name: string; sales: number }>;
}