// src/config/apiConfig.ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.29.213:8000/api/v1";
// Super Admin Backend API
export const SUPER_ADMIN_API_BASE_URL =
  import.meta.env.VITE_SUPER_ADMIN_API_BASE_URL ||
  "http://localhost:4001/admin";

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
