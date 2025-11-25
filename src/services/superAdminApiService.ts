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
  email: string | null; // UPDATED: Based on schema
  phone: string | null; // UPDATED: Based on schema
  phone2?: string | null; // NEW: Secondary phone number
  gstin?: string | null; // NEW: GSTIN number
  logoUrl?: string | null; // NEW: Logo URL path
  address: string | null; // UPDATED: Based on schema
  isActive: boolean;
  featureFlags?: Record<string, boolean> | null; // Feature flags for granular control
  subscriptionId?: string;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

// NEW: Minimal User type for the restaurant users list
export interface RestaurantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurantId: string;
}

export interface Plan {
  // ... (your existing Plan interface)
  id: string;
  name: string;
  price: any; // Keep the fix from our previous conversation
  features: any; // Keep the fix from our previous conversation
  createdAt: string;
  updatedAt: string;
}

// ... (other interfaces: Subscription, Announcement, Setting) ...
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
        // Handle backend's { message: "...", data: null, success: false, statusCode: 400 }
        if (data && data.success === false) {
          throw {
            code: data.statusCode || response.status,
            message: data.message || "Request failed",
            errors: data.errors,
          } as SuperAdminApiError;
        }
        // Handle simple error messages
        throw {
          code: response.status,
          message: data.message || "Request failed",
          errors: data.errors,
        } as SuperAdminApiError;
      }

      // Handle successful responses that might have { success: true, data: ..., ... }
      if (data && data.success === true) {
        return data.data;
      }

      // Handle simple data responses
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
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // NEW: Impersonate User
  async impersonateUser(userId: string): Promise<{ accessToken: string }> {
    return this.request("/auth/impersonate", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    return this.request("/restaurants");
  }

  // NEW: Get single restaurant
  async getRestaurant(id: string): Promise<Restaurant> {
    return this.request(`/restaurants/${id}`);
  }

  // UPDATED: Create Restaurant
  async createRestaurant(data: {
    name: string;
    email?: string;
    phone?: string;
    phone2?: string;
    gstin?: string;
    address?: string;
    logo?: File;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    featureFlags?: Record<string, boolean>;
  }): Promise<Restaurant> {
    const formData = new FormData();

    // Append all text fields
    Object.keys(data).forEach((key) => {
      if (
        key !== "logo" &&
        key !== "featureFlags" &&
        (data as any)[key] !== undefined
      ) {
        formData.append(key, (data as any)[key]);
      }
    });

    // Append featureFlags as JSON string if provided
    if (data.featureFlags) {
      formData.append("featureFlags", JSON.stringify(data.featureFlags));
    }

    // Append file if exists
    if (data.logo) {
      formData.append("logo", data.logo);
    }

    // Use fetch directly to handle FormData (browser sets Content-Type with boundary)
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${this.baseURL}/restaurants`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw {
        code: response.status,
        message: result.message || "Request failed",
      } as SuperAdminApiError;
    }
    return result;
  }

  // NEW: Update Restaurant
  async updateRestaurant(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      phone2?: string;
      gstin?: string;
      address?: string;
      logo?: File;
      featureFlags?: Record<string, boolean>;
    }
  ): Promise<Restaurant> {
    const formData = new FormData();

    // Append all fields except logo and featureFlags
    Object.keys(data).forEach((key) => {
      if (
        key !== "logo" &&
        key !== "featureFlags" &&
        (data as any)[key] !== undefined &&
        (data as any)[key] !== null
      ) {
        formData.append(key, (data as any)[key]);
      }
    });

    // Append featureFlags as JSON string if provided
    if (data.featureFlags) {
      formData.append("featureFlags", JSON.stringify(data.featureFlags));
    }

    // Append file if exists
    if (data.logo instanceof File) {
      formData.append("logo", data.logo);
    }

    // Use fetch directly to handle FormData
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${this.baseURL}/restaurants/${id}`, {
      method: "PATCH",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw {
        code: response.status,
        message: result.message || "Request failed",
      } as SuperAdminApiError;
    }
    return result;
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

  // NEW: Get users for a restaurant
  async getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]> {
    return this.request(`/users?restaurantId=${restaurantId}`);
  }

  // Plans
  // ... (your existing plan methods: getPlans, createPlan, updatePlan, deletePlan)
  async getPlans(): Promise<Plan[]> {
    return this.request("/plans");
  }

  async createPlan(data: {
    name: string;
    price: number;
    features: { [key: string]: any };
  }): Promise<Plan> {
    return this.request("/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePlan(
    id: string,
    data: { name?: string; price?: number; features?: { [key: string]: any } }
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
  // ... (your existing subscription methods)
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
  // ... (your existing announcement methods)
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
  // ... (your existing settings methods)
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

  // Zomato Integration
  async getZomatoConfig(restaurantId: string): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/zomato-config`);
  }

  async updateZomatoConfig(
    restaurantId: string,
    data: {
      zomatoApiKey: string;
      zomatoRestaurantId: string;
      webhookSecret?: string;
      enabled: boolean;
    }
  ): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/zomato-config`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteZomatoConfig(restaurantId: string): Promise<void> {
    return this.request(`/restaurants/${restaurantId}/zomato-config`, {
      method: "DELETE",
    });
  }

  // WhatsApp Integration
  async getWhatsAppConfig(restaurantId: string): Promise<{
    whatsappEnabled: boolean;
    whatsappProvider: "PLATFORM" | "CUSTOM";
    messageCredits: number;
  }> {
    return this.request(`/restaurants/${restaurantId}/whatsapp-config`);
  }

  async updateWhatsAppConfig(
    restaurantId: string,
    data: {
      whatsappEnabled?: boolean;
      whatsappProvider?: "PLATFORM" | "CUSTOM";
      addCredits?: number;
      customConfig?: {
        accountSid: string;
        authToken: string;
        fromNumber: string;
      };
    }
  ): Promise<any> {
    return this.request(`/restaurants/${restaurantId}/whatsapp-config`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

export const superAdminApi = new SuperAdminApiService();
