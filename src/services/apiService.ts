// src/services/apiService.ts
import { API_BASE_URL, API_ENDPOINTS } from "@/config/apiConfig";
import { APIMenuItem, APITable } from "@/types/restaurant";

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
    >("/menu/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async createMenuItem(itemData: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
  }) {
    return this.request<
      ApiResponse<{
        id: string;
        name: string;
        description: string;
        price: number;
        isAvailable: boolean;
        categoryId: string;
      }>
    >("/menu/items", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  // Menu Management
  async getMenuCategories() {
    return this.request<{
      data: Array<{
        id: string;
        name: string;
        description: string | null;
        restaurantId: string;
      }>;
    }>(API_ENDPOINTS.menu.categories);
  }

  async getMenuItems() {
    return this.request<{ data: APIMenuItem[] }>(API_ENDPOINTS.menu.items);
  }

  async updateMenuItem(itemId: string, itemData: {
    name: string;
    description: string;
    price: number;
    categoryId?: string;
    isAvailable?: boolean;
  }) {
    return this.request<ApiResponse<APIMenuItem>>(`/menu/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(itemData),
    });
  }

  async deleteMenuItem(itemId: string) {
    return this.request<ApiResponse<void>>(`/menu/items/${itemId}`, {
      method: "DELETE",
    });
  }

  async updateCategory(categoryId: string, categoryData: {
    name: string;
    description: string;
  }) {
    return this.request<ApiResponse<any>>(`/menu/categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(categoryId: string) {
    return this.request<ApiResponse<void>>(`/menu/categories/${categoryId}`, {
      method: "DELETE",
    });
  }

  // Order Management
  async createOrder(orderData: {
    tableId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
    }>;
  }) {
    return this.request<{
      data: {
        id: string;
        status: string;
        totalAmount: number;
        paymentStatus: string;
        restaurantId: string;
        tableId: string;
        userId: string;
        orderItems: Array<{
          id: string;
          quantity: number;
          price: number;
          menuItemId: string;
        }>;
      };
    }>("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async getAllOrders() {
    return this.request<{
      data: Array<{
        id: string;
        status: "PENDING" | "ORDERED" | "PREPARING" | "PREPARED" | "SERVED" | "COMPLETED" | "CANCELLED";
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
        table?: {
          id: string;
          tableNumber: string;
          capacity: number;
          status: string;
        };
      }>;
    }>("/orders");
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request<{
      data: {
        id: string;
        status: "PENDING" | "ORDERED" | "PREPARING" | "PREPARED" | "SERVED" | "COMPLETED" | "CANCELLED";
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
      };
    }>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async addItemsToOrder(
    orderId: string,
    items: Array<{ menuItemId: string; quantity: number }>
  ) {
    return this.request<ApiResponse<any>>(`/orders/${orderId}/items`, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  }

  async getOrderDetails(orderId: string) {
    return this.request<ApiResponse<any>>(`/orders/${orderId}`);
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
    }>("/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  }

  // Table Management
  async getTables() {
    return this.request<{
      data: Array<APITable>;
    }>("/tables");
  }

  async allocateTable(tableId: string, orderId: string, partySize: number) {
    return this.request<ApiResponse<APITable>>(`/tables/${tableId}/allocate`, {
      method: "POST",
      body: JSON.stringify({ orderId, partySize }),
    });
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

  async getActiveOrderForTable(tableId: string) {
    return this.request<ApiResponse<any>>(`/tables/${tableId}/active-order`);
  }

  // Inventory Management
  async getInventory() {
    return this.request<{
      data: Array<{
        id: string;
        name: string;
        unit: string;
        quantity: number;
        threshold: number;
      }>;
    }>("/inventory");
  }

  async createInventoryItem(itemData: {
    name: string;
    unit: string;
    quantity: number;
    threshold: number;
  }) {
    return this.request<ApiResponse<any>>("/inventory", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  async updateInventoryItem(itemId: string, itemData: {
    name: string;
    unit: string;
    quantity: number;
    threshold: number;
  }) {
    return this.request<ApiResponse<any>>(`/inventory/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(itemData),
    });
  }

  async deleteInventoryItem(itemId: string) {
    return this.request<ApiResponse<void>>(`/inventory/${itemId}`, {
      method: "DELETE",
    });
  }

  // User Management
  async getUsers() {
    return this.request<{
      data: Array<{
        id: string;
        name: string;
        email: string;
        phone?: string;
        role: "ADMIN" | "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN_STAFF";
      }>;
    }>("/users");
  }

  async updateUser(userId: string, userData: {
    name: string;
    email: string;
    phone?: string;
    role: string;
  }) {
    return this.request<ApiResponse<any>>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string) {
    return this.request<ApiResponse<void>>(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  // Chef Management
  async getPreparingOrders() {
    return this.request<{
      data: Array<{
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
        table?: {
          id: string;
          tableNumber: string;
          capacity: number;
          status: string;
        };
      }>;
    }>("/chef/orders/preparing");
  }

  async updateOrderStatusByChef(orderId: string, status: 'PREPARED') {
    return this.request<{
      data: {
        id: string;
        status: "PENDING" | "PREPARING" | "SERVED" | "COMPLETED" | "CANCELLED" | "PREPARED";
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
      };
    }>(`/chef/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Reports
  async getSalesReport(startDate: string, endDate: string) {
    return this.request<{
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      topSellingItems: Array<{
        name: string;
        quantity: number;
        revenue: number;
      }>;
      dailySales: Array<{
        date: string;
        revenue: number;
        orders: number;
      }>;
    }>(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
  }
}

export const apiService = new ApiService();
