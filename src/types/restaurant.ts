// src/types/restaurant.ts

export interface MenuItemVariant {
  id: string;
  name: string;
  nameHindi?: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  available: boolean;
  variants: MenuItemVariant[];
}

export interface APIMenuItem {
  id: string;
  name: string;
  nameHindi?: string;
  description: string | null;
  descriptionHindi?: string | null;
  isAvailable: boolean;
  restaurantId: string;
  categoryId: string | null;
  variants: Array<{
    id: string;
    name: string;
    nameHindi?: string;
    price: string;
  }>;
}

// New status enum reflecting backend changes for a single item
export type OrderItemStatus =
  | "PENDING"
  | "ORDERED"
  | "PREPARING"
  | "PREPARED"
  | "SERVED"
  | "CANCELLED";

export type OrderItemPaymentStatus = "UNPAID" | "PAID";

export interface OrderItem {
  id: string;
  menuItemVariant: {
    id: string;
    name: string;
    nameHindi?: string;
    price: number;
    menuItem: {
      id: string;
      name: string;
      nameHindi?: string;
      description?: string;
      descriptionHindi?: string;
      category: string;
      available: boolean;
    };
  };
  quantity: number;
  note?: string;
  status: OrderItemStatus;
  paymentStatus: OrderItemPaymentStatus;
  price: number; // Price at the time of order
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
  orderStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null;
}

// Restaurant interface for order details
export interface APIRestaurant {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  phone2?: string | null;
  gstin?: string | null;
  logoUrl?: string | null;
  address?: string | null;
}

// Payment types
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET";

export interface APIPayment {
  id: string;
  amount: number;
  tenderedAmount?: number | null;
  changeAmount?: number | null;
  paymentMethod: PaymentMethod;
  status: "SUCCESS" | "FAILED" | "PENDING";
  transactionId?: string | null;
  createdAt: string;
}

// APIOrder now has updated structure with variants
export interface APIOrder {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  paymentStatus: "UNPAID" | "PAID" | "PARTIAL" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  tableId: string | null;
  takeAway: boolean;
  orderType?:
    | "DINE_IN"
    | "TAKE_AWAY"
    | "DELIVERY_ZOMATO"
    | "DELIVERY_SWIGGY"
    | "DELIVERY_OTHER";
  sourceId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  restaurant?: APIRestaurant | null;
  table?: {
    id: string;
    tableNumber: string;
  } | null;
  userId: string | null;
  payments?: APIPayment[];
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    note?: string;
    status: OrderItemStatus;
    paymentStatus: OrderItemPaymentStatus;
    menuItemVariantId: string;
    menuItemVariant: {
      id: string;
      name: string;
      nameHindi?: string;
      price: number;
      menuItem: {
        id: string;
        name: string;
        nameHindi?: string;
        description: string | null;
        descriptionHindi?: string | null;
        isAvailable: boolean;
        restaurantId: string;
        categoryId: string | null;
      };
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

// --- NEW: Supplier Type ---
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

// --- NEW: PurchaseOrder Types ---
export interface PurchaseOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryItem: InventoryItem;
}

export interface PurchaseOrder {
  id: string;
  supplier: Supplier;
  invoiceNumber?: string | null;
  totalAmount: number;
  purchaseDate: string;
  purchaseItems: PurchaseOrderItem[];
}

// --- NEW: StockLog Type ---
export type StockChangeType = "ADD" | "REMOVE" | "ADJUST" | "WASTAGE" | "USAGE";

export interface StockLog {
  id: string;
  changeType: StockChangeType;
  quantity: number;
  remarks?: string | null;
  createdAt: string;
  inventoryItem: InventoryItem;
}

// --- NEW: Types for menu item variant creation/update ---
export interface CreateMenuItemVariantDTO {
  name: string;
  nameHindi?: string;
  price: number;
}

export interface CreateMenuItemDTO {
  name: string;
  nameHindi?: string;
  description?: string;
  descriptionHindi?: string;
  categoryId: string;
  variants: CreateMenuItemVariantDTO[];
}

export interface UpdateMenuItemDTO {
  name?: string;
  nameHindi?: string;
  description?: string;
  descriptionHindi?: string;
  categoryId?: string;
  variants?: CreateMenuItemVariantDTO[];
}

// --- NEW: Types for order item creation ---
export interface CreateOrderItemDTO {
  menuItemVariantId: string;
  quantity: number;
  note?: string;
}

export interface CreateOrderDTO {
  tableId?: string;
  takeAway?: boolean;
  customerName?: string;
  items: CreateOrderItemDTO[];
}
