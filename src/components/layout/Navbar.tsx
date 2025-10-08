import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  ShoppingCart,
  Users,
  ChefHat,
  BarChart3,
  Package,
  LogOut,
  Utensils,
  Truck,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getNavItems = () => {
    if (!user) return [];

    const commonItems = [
      { icon: Home, label: "Dashboard", path: "/dashboard" },
    ];

    switch (user.role) {
      case "admin":
        return [
          ...commonItems,
          { icon: BarChart3, label: "Reports", path: "/reports" },
          { icon: Package, label: "Inventory", path: "/inventory" },
          { icon: Utensils, label: "Menu", path: "/menu" },
          { icon: Users, label: "Users", path: "/users" },
          { icon: Truck, label: "Supplier", path: "/supplier" },
          {
            icon: ShoppingCart,
            label: "Purchase Order",
            path: "/purchase-order",
          },
        ];
      case "manager":
        return [
          ...commonItems,
          { icon: BarChart3, label: "Tables", path: "/tables" },
          { icon: Package, label: "Inventory", path: "/inventory" },
          { icon: Utensils, label: "Menu", path: "/menu" },
          { icon: Users, label: "Users", path: "/users" },
          { icon: Truck, label: "Supplier", path: "/supplier" },
          {
            icon: ShoppingCart,
            label: "Purchase Order",
            path: "/purchase-order",
          },
        ];
      case "cashier":
        return [
          ...commonItems,
          { icon: ShoppingCart, label: "POS", path: "/pos" },
        ];
      case "waiter":
        return [
          ...commonItems,
          { icon: Users, label: "Tables", path: "/tables" },
        ];
      case "chef":
        return [
          ...commonItems,
          { icon: ChefHat, label: "Kitchen", path: "/kitchen" },
        ];
      default:
        return commonItems;
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Utensils className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                RestaurantPOS
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-fast"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="font-medium text-foreground">{user.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
