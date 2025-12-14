import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useRefresh } from "@/contexts/RefreshContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFeature } from "@/hooks/useFeature";
import { useLanguage } from "@/contexts/LanguageContext";
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
  UserCheck,
  Clock,
  FileText,
  Armchair,
  Coins,
  CookingPot,
  Receipt,
  Settings,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { triggerRefresh } = useRefresh();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { language, setLanguage } = useLanguage();

  // Feature flag checks
  const hasInventoryManagement = useFeature("inventory_management");
  const hasReports = useFeature("reports");
  const hasAttendance = useFeature("attendance");

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
    setShowLogoutDialog(false);
  };

  const handleRefresh = () => {
    triggerRefresh();
  };

  const getNavCategories = () => {
    if (!user) return [];

    switch (user.role) {
      case "admin":
        const adminCategories: any[] = [
          {
            label: "Dashboard",
            path: "/dashboard",
            icon: Home,
          },
          {
            label: "Operations",
            items: [
              { icon: ShoppingCart, label: "POS System", path: "/pos" },
              { icon: Armchair, label: "Tables", path: "/tables" },
              { icon: CookingPot, label: "Kitchen", path: "/kitchen" },
              { icon: Coins, label: "Manage Orders", path: "/cashier" },
            ],
          },
        ];

        // Menu & Inventory section - conditionally add inventory items
        const inventoryItems = [
          { icon: Utensils, label: "Menu", path: "/menu" },
        ];
        if (hasInventoryManagement) {
          inventoryItems.push(
            { icon: Package, label: "Inventory", path: "/inventory" },
            { icon: Truck, label: "Suppliers", path: "/supplier" },
            {
              icon: ShoppingCart,
              label: "Purchase Orders",
              path: "/purchase-order",
            }
          );
        }
        adminCategories.push({
          label: "Menu & Inventory",
          items: inventoryItems,
        });

        // People section - conditionally add attendance items
        const peopleItems = [{ icon: Users, label: "Users", path: "/users" }];
        if (hasAttendance) {
          peopleItems.push(
            { icon: UserCheck, label: "Employees", path: "/employees" },
            { icon: Clock, label: "Attendance", path: "/attendance" }
          );
        }
        adminCategories.push({
          label: "People",
          items: peopleItems,
        });

        // Expenses
        adminCategories.push({
          label: "Expenses",
          path: "/expenses",
          icon: Receipt,
        });

        // Reports - only show if enabled
        if (hasReports) {
          adminCategories.push({
            label: "Reports",
            path: "/reports",
            icon: BarChart3,
          });

          // Restaurant Settings
          adminCategories.push({
            // label: "Settings",
            path: "/restaurant-settings",
            icon: Settings,
          });
        }

        return adminCategories;
      case "manager":
        const managerCategories: any[] = [
          {
            label: "Dashboard",
            path: "/dashboard",
            icon: Home,
          },
          {
            label: "Operations",
            items: [
              { icon: ShoppingCart, label: "POS System", path: "/pos" },
              { icon: Armchair, label: "Tables", path: "/tables" },
              { icon: CookingPot, label: "Kitchen", path: "/kitchen" },
              { icon: Coins, label: "Manage Orders", path: "/cashier" },
            ],
          },
        ];

        // Menu & Inventory section - conditionally add inventory items
        const managerInventoryItems = [
          { icon: Utensils, label: "Menu", path: "/menu" },
        ];
        if (hasInventoryManagement) {
          managerInventoryItems.push(
            { icon: Package, label: "Inventory", path: "/inventory" },
            { icon: Truck, label: "Suppliers", path: "/supplier" },
            {
              icon: ShoppingCart,
              label: "Purchase Orders",
              path: "/purchase-order",
            }
          );
        }
        managerCategories.push({
          label: "Menu & Inventory",
          items: managerInventoryItems,
        });

        // People section - conditionally add attendance items
        const managerPeopleItems = [
          { icon: Users, label: "Users", path: "/users" },
        ];
        if (hasAttendance) {
          managerPeopleItems.push(
            { icon: UserCheck, label: "Employees", path: "/employees" },
            { icon: Clock, label: "Attendance", path: "/attendance" }
          );
        }
        managerCategories.push({
          label: "People",
          items: managerPeopleItems,
        });

        // Expenses
        managerCategories.push({
          label: "Expenses",
          path: "/expenses",
          icon: Receipt,
        });

        // Reports - only show if enabled
        if (hasReports) {
          managerCategories.push({
            label: "Reports",
            path: "/reports",
            icon: BarChart3,
          });
        }

        return managerCategories;
      case "cashier":
        // Get cashier layout mode to determine which tabs to show
        const cashierLayoutMode =
          (user?.restaurant?.featureFlags?.cashier_layout_mode as string) ||
          "both";

        const cashierNavItems = [];

        if (cashierLayoutMode === "pos_only" || cashierLayoutMode === "both") {
          cashierNavItems.push({
            icon: ShoppingCart,
            label: "POS",
            path: "/pos",
          });
        }

        if (
          cashierLayoutMode === "manage_orders" ||
          cashierLayoutMode === "both"
        ) {
          cashierNavItems.push({
            icon: Coins,
            label: "Manage Orders",
            path: "/cashier",
          });
        }

        return cashierNavItems;
      case "waiter":
        return [{ icon: Armchair, label: "Tables", path: "/tables" }];
      case "chef":
        return [{ icon: ChefHat, label: "Kitchen", path: "/kitchen" }];
      default:
        return [];
    }
  };

  const navCategories = getNavCategories();
  const flatNavItems = navCategories.flatMap((cat) =>
    cat.items ? cat.items : cat.path ? [cat as any] : []
  );

  // Get home path based on user role
  const getHomePath = () => {
    if (!user) return "/dashboard";

    switch (user.role) {
      case "admin":
      case "manager":
        return "/dashboard";
      case "waiter":
        return "/tables";
      case "chef":
        return "/kitchen";
      case "cashier":
        const cashierLayoutMode =
          (user?.restaurant?.featureFlags?.cashier_layout_mode as string) ||
          "both";
        if (cashierLayoutMode === "manage_orders") {
          return "/cashier";
        } else if (cashierLayoutMode === "pos_only") {
          return "/pos";
        } else {
          return "/pos";
        }
      default:
        return "/dashboard";
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to={getHomePath()} className="flex items-center space-x-2">
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
            {(user?.role === "admin" || user?.role === "manager") && (
              <NavigationMenu className="hidden md:flex">
                <NavigationMenuList>
                  {navCategories.map((category, idx) => (
                    <NavigationMenuItem key={idx}>
                      {category.items ? (
                        <>
                          <NavigationMenuTrigger className="text-sm font-medium">
                            {category.label}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                              {category.items.map((item) => (
                                <li key={item.path}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      to={item.path}
                                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                    >
                                      <div className="flex items-center gap-2">
                                        <item.icon className="h-4 w-4" />
                                        <div className="text-sm font-medium leading-none">
                                          {item.label}
                                        </div>
                                      </div>
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <Link
                          to={category.path!}
                          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                        >
                          <category.icon className="h-4 w-4" />
                          <span>{category.label}</span>
                        </Link>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}

            {/* Simple navigation for other roles */}
            {user?.role !== "admin" && user?.role !== "manager" && (
              <div className="hidden md:flex items-center space-x-4">
                {flatNavItems.map((item: any) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
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
                {/* Language Toggle */}
                <div className="flex items-center rounded-md border">
                  <button
                    className={`px-2 py-1 text-xs rounded-l-md ${
                      language === "en" ? "bg-muted font-semibold" : ""
                    }`}
                    onClick={() => setLanguage("en")}
                    title="English"
                  >
                    EN
                  </button>
                  <button
                    className={`px-2 py-1 text-xs rounded-r-md ${
                      language === "hi" ? "bg-muted font-semibold" : ""
                    }`}
                    onClick={() => setLanguage("hi")}
                    title="Hindi"
                  >
                    हि
                  </button>
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
                            <h2 className="font-semibold text-lg">
                              RasoiTrack
                            </h2>
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
                      <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
                        {navCategories.map((category: any, idx) => (
                          <div key={idx}>
                            {category.items ? (
                              <div className="space-y-1">
                                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  {category.label}
                                </div>
                                {category.items.map((item: any) => (
                                  <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileNavOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">
                                      {item.label}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <Link
                                to={category.path!}
                                onClick={() => setMobileNavOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              >
                                <category.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">
                                  {category.label}
                                </span>
                              </Link>
                            )}
                          </div>
                        ))}
                      </nav>

                      {/* Mobile Footer */}
                      <div className="p-4 border-t space-y-2">
                        {/* Mobile Language Toggle */}
                        <div className="flex items-center justify-between px-2">
                          <span className="text-sm text-muted-foreground">
                            Language
                          </span>
                          <div className="flex rounded-md border">
                            <button
                              className={`px-2 py-1 text-xs rounded-l-md ${
                                language === "en"
                                  ? "bg-muted font-semibold"
                                  : ""
                              }`}
                              onClick={() => setLanguage("en")}
                            >
                              EN
                            </button>
                            <button
                              className={`px-2 py-1 text-xs rounded-r-md ${
                                language === "hi"
                                  ? "bg-muted font-semibold"
                                  : ""
                              }`}
                              onClick={() => setLanguage("hi")}
                            >
                              हि
                            </button>
                          </div>
                        </div>
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

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to sign in again to
              access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};
