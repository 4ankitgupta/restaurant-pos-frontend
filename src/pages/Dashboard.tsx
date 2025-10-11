// src/pages/Dashboard.tsx

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { CashierDashboard } from "@/components/dashboard/CashierDashboard";
import { WaiterDashboard } from "@/components/dashboard/WaiterDashboard";
import { ChefDashboard } from "@/components/dashboard/ChefDashboard";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "cashier":
      return <CashierDashboard />;
    default:
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>Welcome to the Restaurant POS System</p>
        </div>
      );
  }
};

export default Dashboard;
