import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useRefresh } from "@/contexts/RefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";
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
  RefreshCw,
  Menu,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { triggerRefresh } = useRefresh();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRefresh = () => {
    triggerRefresh();
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
          { icon: Truck, label: "Supplier", path: "/supplier" },
          {
            icon: ShoppingCart,
            label: "Purchase Order",
            path: "/purchase-order",
          },
          { icon: Utensils, label: "Menu", path: "/menu" },
          { icon: Users, label: "Users", path: "/users" },
        ];
      case "manager":
        return [
          ...commonItems,
          { icon: Package, label: "Inventory", path: "/inventory" },
          { icon: Truck, label: "Supplier", path: "/supplier" },
          {
            icon: ShoppingCart,
            label: "Purchase Order",
            path: "/purchase-order",
          },
          { icon: BarChart3, label: "Tables", path: "/tables" },
          { icon: Utensils, label: "Menu", path: "/menu" },
          { icon: Users, label: "Users", path: "/users" },
        ];
      case "cashier":
        return [
          // ...commonItems,
          { icon: ShoppingCart, label: "POS", path: "/pos" },
        ];
      case "waiter":
        return [
          // ...commonItems,
          { icon: Users, label: "Tables", path: "/tables" },
        ];
      case "chef":
        return [
          // ...commonItems,
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
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/logo.png"
                  alt="RestaurantPOS Logo"
                  className="w-12 object-contain mx-auto"
                />
              </div>

              <div className="flex flex-col items-center justify-center">
                <img
                  src="/rasoi_trackLogo.png"
                  alt="RestaurantPOS Logo"
                  className="w-32 object-contain mx-auto"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
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
            <div className="flex items-center space-x-2">
              {/* Desktop User Info & Actions */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {user.role}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>

              {/* Mobile Hamburger Menu */}
              {isMobile && (
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <div className="flex flex-col h-full">
                      {/* Mobile Header */}
                      <div className="p-6 border-b">
                        <div className="flex items-center gap-3">
                          <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-10 h-10 object-contain"
                          />
                          <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-lg">RasoiTrack</h2>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {user.role}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Navigation */}
                      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileNavOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        ))}
                      </nav>

                      {/* Mobile Footer */}
                      <div className="p-4 border-t space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={() => {
                            handleRefresh();
                            setMobileNavOpen(false);
                          }}
                        >
                          <RefreshCw className="w-5 h-5" />
                          Refresh
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            handleLogout();
                            setMobileNavOpen(false);
                          }}
                        >
                          <LogOut className="w-5 h-5" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
