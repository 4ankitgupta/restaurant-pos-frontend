import { SUPER_ADMIN_API_BASE_URL } from "@/config/apiConfig";

export interface SuperAdminApiError {
  code: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface SuperAdminApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// Types for Super Admin entities
export interface Restaurant {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  subscriptionId?: string;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  restaurantId: string;
  planId: string;
  status: string;
  nextBillingDate?: string;
  restaurant?: Restaurant;
  plan?: Plan;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

class SuperAdminApiService {
  private baseURL = SUPER_ADMIN_API_BASE_URL;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("adminToken");

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
        throw {
          code: response.status,
          message: data.message || "Request failed",
          errors: data.errors,
        } as SuperAdminApiError;
      }

      return data.data || data;
    } catch (error) {
      if ((error as SuperAdminApiError).code) {
        throw error;
      }
      throw {
        code: 500,
        message: "Network error occurred",
      } as SuperAdminApiError;
    }
  }

  // Auth
  async login(email: string, password: string): Promise<any> {
    // Changed type to 'any' to reflect reality
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    return this.request("/restaurants");
  }

  async createRestaurant(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<Restaurant> {
    return this.request("/restaurants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRestaurantStatus(
    id: string,
    isActive: boolean
  ): Promise<Restaurant> {
    return this.request(`/restaurants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  }

  // Plans
  async getPlans(): Promise<Plan[]> {
    return this.request("/plans");
  }

  async createPlan(data: {
    name: string;
    price: number;
    features: string[];
  }): Promise<Plan> {
    return this.request("/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePlan(
    id: string,
    data: { name?: string; price?: number; features?: string[] }
  ): Promise<Plan> {
    return this.request(`/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePlan(id: string): Promise<void> {
    return this.request(`/plans/${id}`, {
      method: "DELETE",
    });
  }

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    return this.request("/subscriptions");
  }

  async createSubscription(data: {
    restaurantId: string;
    planId: string;
    status: string;
    nextBillingDate?: string;
  }): Promise<Subscription> {
    return this.request("/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSubscription(
    id: string,
    data: {
      planId?: string;
      status?: string;
      nextBillingDate?: string;
    }
  ): Promise<Subscription> {
    return this.request(`/subscriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    return this.request("/announcements");
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
  }): Promise<Announcement> {
    return this.request("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(
    id: string,
    data: { title?: string; content?: string }
  ): Promise<Announcement> {
    return this.request(`/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string): Promise<void> {
    return this.request(`/announcements/${id}`, {
      method: "DELETE",
    });
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return this.request("/settings");
  }

  async getSetting(key: string): Promise<Setting> {
    return this.request(`/settings/${key}`);
  }

  async upsertSetting(data: {
    key: string;
    value: string;
    description?: string;
  }): Promise<Setting> {
    return this.request("/settings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const superAdminApi = new SuperAdminApiService();
