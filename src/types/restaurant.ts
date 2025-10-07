// src/types/restaurant.ts

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
  price: string;
  isAvailable: boolean;
  restaurantId: string;
  categoryId: string | null;
}

// New status enum reflecting backend changes for a single item
export type OrderItemStatus =
  | "PENDING"
  | "ORDERED"
  | "PREPARING"
  | "PREPARED"
  | "SERVED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: OrderItemStatus; // Updated type
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

// APIOrder now has a simplified status but individual items have a detailed status
export interface APIOrder {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; // Updated to reflect backend
  totalAmount: number;
  paymentStatus: "UNPAID" | "PAID" | "PARTIAL" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  tableId: string | null;
  userId: string | null;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    status: OrderItemStatus; // Added new status field for each item
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

// --- NEW: InventoryItem Type ---
export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  lastUpdated: string;
  restaurantId: string;
}
