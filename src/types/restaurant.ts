export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
}

export interface APIMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  restaurantId: string;
  categoryId: string | null;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: "pending" | "preparing" | "ready" | "served";
}

export interface Order {
  id: string;
  tableNumber?: number;
  customerName?: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "served" | "paid";
  total: number;
  createdAt: Date;
  updatedAt: Date;
  waiterId?: string;
}

export interface APITable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "Available" | "Occupied" | "Reserved" | "NeedCleaning";
  restaurantId: string;
}

export interface APIOrder {
  id: string;
  status: "PENDING" | "PREPARING" | "SERVED" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  paymentStatus: "UNPAID" | "PAID" | "PARTIAL";
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  tableId: string | null;
  userId: string | null;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItemId: string;
    menuItem: {
      id: string;
      name: string;
      description: string | null;
      price: number;
      isAvailable: boolean;
      restaurantId: string;
      categoryId: string | null;
    };
  }>;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "needs-cleaning";
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
