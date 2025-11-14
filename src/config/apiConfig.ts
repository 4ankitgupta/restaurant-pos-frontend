// src/config/apiConfig.ts
export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_BASE_URL ||
  "http://10.178.206.124:8000/api/v1";

// WebSocket Configuration
export const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL || "ws://10.178.206.124:8000";

// Super Admin Backend API
export const SUPER_ADMIN_API_BASE_URL =
  import.meta.env.VITE_SUPER_ADMIN_API_BASE_URL ||
  "http://10.178.206.124:4001/admin";

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  menu: {
    categories: "/menu-categories",
    items: "/menu-items",
  },
  orders: {
    create: "/orders",
    updateStatus: (orderId: string) => `/orders/${orderId}/status`,
  },
} as const;
