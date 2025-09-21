import { API_BASE_URL, API_ENDPOINTS } from "@/config/apiConfig";
import { APIMenuItem } from "@/types/restaurant";

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
    return this.request<APIMenuItem[]>(API_ENDPOINTS.menu.items);
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

  async updateOrderStatus(orderId: string, status: string) {
    return this.request<{
      data: {
        id: string;
        status: string;
        totalAmount: number;
        paymentStatus: string;
      };
    }>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
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
    }>("/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  }

  // Table Management
  async getTables() {
    return this.request<{
      data: Array<{
        id: string;
        tableNumber: string;
        capacity: number;
        status: "Available" | "Occupied" | "Reserved";
        restaurantId: string;
      }>;
    }>("/tables");
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
}

export const apiService = new ApiService();
