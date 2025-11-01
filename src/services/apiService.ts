// src/services/apiService.ts
import { API_BASE_URL } from "@/config/apiConfig";
import {
  APIMenuItem,
  APITable,
  APIOrder,
  OrderItemStatus,
  InventoryItem,
  Supplier,
  PurchaseOrder,
  StockChangeType,
} from "@/types/restaurant";

export interface ApiError {
  code: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

class ApiService {
  private baseURL = API_BASE_URL;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("accessToken");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw data as ApiError;
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          code: 0,
          message: "Network error. Please check your connection.",
        } as ApiError;
      }
      throw error;
    }
  }

  // --- AI Chat Agent Actions ---
  getAIConversations = () => {
    return this.request<ApiResponse<Array<{ id: string; title: string }>>>(
      "/agent/conversations"
    );
  };

  getAIConversation = (conversationId: string) => {
    return this.request<
      ApiResponse<Array<{ role: "USER" | "AI"; content: string }>>
    >(`/agent/conversations/${conversationId}`);
  };

  sendAIMessage = (message: string, conversationId: string | null) => {
    return this.request<
      ApiResponse<{ response: string; conversationId: string }>
    >("/agent", {
      method: "POST",
      body: JSON.stringify(
        conversationId ? { message, conversationId } : { message }
      ),
    });
  };

  // --- Cashier Actions ---
  getActiveAndUnpaidOrders = () => {
    return this.request<ApiResponse<APIOrder[]>>("/cashier/orders");
  };

  getCompletedOrders = () => {
    return this.request<ApiResponse<APIOrder[]>>("/cashier/orders/completed");
  };

  getCashierOrderDetails = (orderId: string) => {
    return this.request<ApiResponse<APIOrder>>(`/cashier/orders/${orderId}`);
  };

  addItemsToCashierOrder = (
    orderId: string,
    items: Array<{ menuItemVariantId: string; quantity: number; note?: string }>
  ) => {
    return this.request<ApiResponse<APIOrder>>(
      `/cashier/orders/${orderId}/items`,
      {
        method: "POST",
        body: JSON.stringify({ items }),
      }
    );
  };

  createTakeawayOrder = (
    items: Array<{ menuItemVariantId: string; quantity: number; note?: string }>
  ) => {
    return this.request<ApiResponse<APIOrder>>("/cashier/orders/takeaway", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  };

  // --- Waiter Actions ---
  async createOrder(orderData: {
    tableId?: string;
    takeAway?: boolean;
    customerName?: string;
    items: Array<{
      menuItemVariantId: string;
      quantity: number;
      note?: string;
    }>;
  }) {
    return this.request<ApiResponse<APIOrder>>("/waiter/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async addItemsToOrder(
    orderId: string,
    items: Array<{ menuItemVariantId: string; quantity: number; note?: string }>
  ) {
    return this.request<ApiResponse<APIOrder>>(
      `/waiter/orders/${orderId}/items`,
      {
        method: "POST",
        body: JSON.stringify({ items }),
      }
    );
  }

  async updateOrderItemStatus(
    orderItemId: string,
    status: "SERVED" | "CANCELLED"
  ) {
    return this.request<ApiResponse<any>>(
      `/waiter/order-items/${orderItemId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  }

  async completeOrder(orderId: string) {
    return this.request<ApiResponse<APIOrder>>(
      `/waiter/orders/${orderId}/complete`,
      {
        method: "PATCH",
      }
    );
  }

  // --- General Order Actions ---
  async getAllOrders() {
    return this.request<{
      data: APIOrder[];
    }>("/orders");
  }

  async getOrderDetails(orderId: string) {
    return this.request<ApiResponse<any>>(`/orders/${orderId}`);
  }

  // --- Chef Actions ---
  async getPreparingOrders() {
    return this.request<{
      data: Array<APIOrder>;
    }>("/chef/orders/preparing");
  }

  async updateOrderItemStatusByChef(
    orderItemId: string,
    status: OrderItemStatus
  ) {
    return this.request<{ data: any }>(
      `/chef/order-items/${orderItemId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  }

  // ... (login, register, menu, payment, table, inventory, user, reports services remain the same)
  // Authentication
  async login(email: string, password: string) {
    return this.request<
      ApiResponse<{
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      }>
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
  }) {
    return this.request<
      ApiResponse<{
        id: string;
        name: string;
        email: string;
        role: string;
      }>
    >("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // Menu Management
  async createCategory(categoryData: { name: string; description: string }) {
    return this.request<
      ApiResponse<{
        id: string;
        name: string;
        description: string;
        restaurantId: string;
      }>
    >("/menu-categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async createMenuItem(itemData: {
    name: string;
    description?: string;
    categoryId: string;
    variants: { name: string; price: number }[];
  }) {
    return this.request<
      ApiResponse<{
        id: string;
        name: string;
        description: string;
        // price removed (variants present)
        isAvailable: boolean;
        categoryId: string;
      }>
    >("/menu-items", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  async getMenuCategories() {
    return this.request<{
      data: Array<{
        id: string;
        name: string;
        description: string | null;
        restaurantId: string;
      }>;
    }>("/menu-categories");
  }

  async getMenuItems() {
    return this.request<{ data: APIMenuItem[] }>("/menu-items");
  }

  async updateMenuItem(
    itemId: string,
    itemData: {
      name?: string;
      description?: string;
      categoryId?: string;
      isAvailable?: boolean;
      variants?: { name: string; price: number }[];
    }
  ) {
    return this.request<ApiResponse<APIMenuItem>>(`/menu-items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(itemData),
    });
  }

  async deleteMenuItem(itemId: string) {
    return this.request<ApiResponse<void>>(`/menu-items/${itemId}`, {
      method: "DELETE",
    });
  }

  async updateCategory(
    categoryId: string,
    categoryData: {
      name: string;
      description: string;
    }
  ) {
    return this.request<ApiResponse<any>>(`/menu-categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(categoryId: string) {
    return this.request<ApiResponse<void>>(`/menu-categories/${categoryId}`, {
      method: "DELETE",
    });
  }

  // Payment Management
  async createPayment(paymentData: {
    orderId: string;
    amount: number;
    paymentMethod: "CASH" | "CARD" | "UPI" | "WALLET";
  }) {
    return this.request<{
      data: {
        id: string;
        amount: number;
        paymentMethod: string;
        status: string;
        orderId: string;
      };
    }>("/cashier/payment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  }

  async refundPayment(orderId: string) {
    return this.request<ApiResponse<APIOrder>>(`/payments/${orderId}/refund`, {
      method: "POST",
    });
  }

  // Table Management
  async getTables() {
    return this.request<{
      data: Array<APITable>;
    }>("/tables");
  }

  async updateTableStatus(tableId: string, status: APITable["status"]) {
    return this.request<ApiResponse<APITable>>(`/tables/${tableId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async seatTable(tableId: string, partySize: number) {
    return this.request<ApiResponse<{ updatedTable: APITable; newOrder: any }>>(
      `/tables/${tableId}/seat`,
      {
        method: "POST",
        body: JSON.stringify({ partySize }),
      }
    );
  }

  async createTable(tableData: {
    tableNumber: string;
    capacity: number;
    status?: APITable["status"];
  }) {
    return this.request<ApiResponse<APITable>>("/tables", {
      method: "POST",
      body: JSON.stringify(tableData),
    });
  }

  async updateTable(
    tableId: string,
    tableData: {
      tableNumber?: string;
      capacity?: number;
      status?: APITable["status"];
    }
  ) {
    return this.request<ApiResponse<APITable>>(`/tables/${tableId}`, {
      method: "PATCH",
      body: JSON.stringify(tableData),
    });
  }

  async deleteTable(tableId: string) {
    return this.request<ApiResponse<APITable>>(`/tables/${tableId}`, {
      method: "DELETE",
    });
  }

  async getActiveOrderForTable(tableId: string) {
    return this.request<ApiResponse<any>>(`/tables/${tableId}/active-order`);
  }

  // User Management
  async getUsers() {
    return this.request<
      {
        id: string;
        name: string;
        email: string;
        phone?: string;
        role: "ADMIN" | "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN_STAFF";
      }[]
    >("/users");
  }

  async updateUser(
    userId: string,
    userData: {
      name: string;
      email: string;
      phone?: string;
      role: string;
    }
  ) {
    return this.request<ApiResponse<any>>(`/auth/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string) {
    return this.request<ApiResponse<void>>(`/auth/${userId}`, {
      method: "DELETE",
    });
  }

  async getSalesReport(startDate: string, endDate: string) {
    // The endpoint might be different depending on your backend routes
    return this.request<any>(
      `/reports/sales?startDate=${startDate}&endDate=${endDate}`
    );
  }

  // --- Inventory Management ---
  async getInventory() {
    return this.request<ApiResponse<InventoryItem[]>>("/inventory");
  }

  async createInventoryItem(itemData: {
    name: string;
    unit: string;
    currentStock: number;
    reorderLevel: number;
  }) {
    return this.request<ApiResponse<InventoryItem>>("/inventory", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  async updateInventoryItem(
    itemId: string,
    itemData: Partial<
      Omit<InventoryItem, "id" | "lastUpdated" | "restaurantId">
    >
  ) {
    return this.request<ApiResponse<InventoryItem>>(`/inventory/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(itemData),
    });
  }

  async deleteInventoryItem(itemId: string) {
    return this.request<ApiResponse<void>>(`/inventory/${itemId}`, {
      method: "DELETE",
    });
  }

  // --- NEW: Supplier Management ---
  async getSuppliers() {
    return this.request<ApiResponse<Supplier[]>>("/suppliers");
  }

  async createSupplier(supplierData: Omit<Supplier, "id">) {
    return this.request<ApiResponse<Supplier>>("/suppliers", {
      method: "POST",
      body: JSON.stringify(supplierData),
    });
  }

  async updateSupplier(
    supplierId: string,
    supplierData: Partial<Omit<Supplier, "id">>
  ) {
    return this.request<ApiResponse<Supplier>>(`/suppliers/${supplierId}`, {
      method: "PATCH",
      body: JSON.stringify(supplierData),
    });
  }

  async deleteSupplier(supplierId: string) {
    return this.request<ApiResponse<void>>(`/suppliers/${supplierId}`, {
      method: "DELETE",
    });
  }

  // --- NEW: Purchase Order Management ---
  async getPurchaseOrders() {
    return this.request<ApiResponse<PurchaseOrder[]>>("/purchase-orders");
  }

  async createPurchaseOrder(orderData: {
    supplierId: string;
    invoiceNumber?: string;
    totalAmount: number;
    purchaseDate?: string;
    items: {
      inventoryItemId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    return this.request<ApiResponse<PurchaseOrder>>("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  // --- NEW: Stock Log (Stock Adjustment) ---
  async adjustStock(logData: {
    inventoryItemId: string;
    changeType: StockChangeType;
    quantity: number;
    remarks?: string;
  }) {
    return this.request<ApiResponse<InventoryItem>>("/stock-logs", {
      method: "POST",
      body: JSON.stringify(logData),
    });
  }

  getManagerDashboard = () => {
    return this.request<ApiResponse<any>>("/dashboard/manager");
  };

  getAdminDashboard = () => {
    return this.request<ApiResponse<any>>("/dashboard/admin");
  };

  getReport = (reportName: string, params: Record<string, string> = {}) => {
    // Filter out empty params
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== "" && value != null
      )
    );
    const query = new URLSearchParams(filteredParams).toString();
    return this.request<ApiResponse<any>>(`/reports/${reportName}?${query}`);
  };
}

export const apiService = new ApiService();
