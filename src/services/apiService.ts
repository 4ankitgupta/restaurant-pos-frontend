import { API_BASE_URL } from '@/config/apiConfig';

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
    const token = localStorage.getItem('accessToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
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
          message: 'Network error. Please check your connection.',
        } as ApiError;
      }
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request<ApiResponse<{
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
    }>>('/auth/login', {
      method: 'POST',
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
    return this.request<ApiResponse<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Menu Management
  async createCategory(categoryData: {
    name: string;
    description: string;
  }) {
    return this.request<ApiResponse<{
      id: string;
      name: string;
      description: string;
      restaurantId: string;
    }>>('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async createMenuItem(itemData: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
  }) {
    return this.request<ApiResponse<{
      id: string;
      name: string;
      description: string;
      price: number;
      isAvailable: boolean;
      categoryId: string;
    }>>('/menu/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
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
    return this.request<ApiResponse<{
      id: string;
      status: string;
      totalAmount: number;
      paymentStatus: string;
      tableId: string;
      userId: string;
      orderItems: Array<{
        id: string;
        quantity: number;
        price: number;
        menuItemId: string;
      }>;
    }>>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request<ApiResponse<{
      id: string;
      status: string;
      totalAmount: number;
      paymentStatus: string;
    }>>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

export const apiService = new ApiService();