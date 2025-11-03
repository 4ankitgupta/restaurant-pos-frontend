// src/components/ui/sidebar.tsx
import {
  Armchair,
  BarChart3,
  BookMarked,
  Clipboard,
  Coins,
  CookingPot,
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserCheck,
  Clock,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: <LayoutDashboard />,
      roles: ["admin", "manager"],
    },
    {
      name: "POS System",
      href: "/pos",
      icon: <ShoppingCart />,
      roles: ["manager", "cashier"],
    },
    {
      name: "Tables",
      href: "/tables",
      icon: <Armchair />,
      roles: ["waiter", "manager"],
    },
    {
      name: "Kitchen",
      href: "/kitchen",
      icon: <CookingPot />,
      roles: ["chef", "manager"],
    },
    {
      name: "Cashier",
      href: "/cashier",
      icon: <Coins />,
      roles: ["cashier", "manager"],
    },
    {
      name: "Menu",
      href: "/menu",
      icon: <BookMarked />,
      roles: ["admin", "manager"],
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: <Clipboard />,
      roles: ["admin", "manager"],
    },
    { name: "Users", href: "/users", icon: <Users />, roles: ["admin"] },
    {
      name: "Employees",
      href: "/employees",
      icon: <UserCheck />,
      roles: ["admin", "manager"],
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: <Clock />,
      roles: ["admin", "manager"],
    },
    {
      name: "Reports",
      href: "/reports",
      icon: <BarChart3 />,
      roles: ["admin", "manager"],
    },
  ];

  const accessibleNavItems = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  return (
    <aside className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src="/rasoi_trackLogo.png" alt="Rasoi Track" className="h-8" />
            <span className="">Rasoi Track</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {accessibleNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                  location.pathname === item.href ? "bg-muted text-primary" : ""
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
