import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useSuperAdminAuth } from "@/contexts/SuperAdminAuthContext";
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
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Package,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { to: "/super-admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/super-admin/restaurants", icon: Store, label: "Restaurants" },
  { to: "/super-admin/plans", icon: Package, label: "Plans" },
  {
    to: "/super-admin/subscriptions",
    icon: CreditCard,
    label: "Subscriptions",
  },
  { to: "/super-admin/announcements", icon: Bell, label: "Announcements" },
  { to: "/super-admin/settings", icon: Settings, label: "Settings" },
];

const NavContent: React.FC<{
  onItemClick?: () => void;
  onLogoutClick?: () => void;
}> = ({ onItemClick, onLogoutClick }) => {
  const { admin } = useSuperAdminAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg">Super Admin</h1>
            <p className="text-xs text-muted-foreground truncate">
              {admin?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={onLogoutClick}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export const SuperAdminLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { logout } = useSuperAdminAuth();

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
    setMobileNavOpen(false);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          {/* Mobile Header */}
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-semibold text-base">Super Admin</h1>
              </div>
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <NavContent
                    onItemClick={() => setMobileNavOpen(false)}
                    onLogoutClick={handleLogoutClick}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </header>

          {/* Mobile Main Content */}
          <main className="p-4">
            <Outlet />
          </main>
        </>
      ) : (
        <>
          {/* Desktop Sidebar */}
          <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
            <NavContent onLogoutClick={handleLogoutClick} />
          </aside>

          {/* Desktop Main Content */}
          <main className="ml-64 min-h-screen">
            <div className="p-8">
              <Outlet />
            </div>
          </main>
        </>
      )}

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
    </div>
  );
};
