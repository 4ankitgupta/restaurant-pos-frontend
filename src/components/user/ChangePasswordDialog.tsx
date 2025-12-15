import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Key } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  const { loading, execute } = useApi();

  const [formData, setFormData] = useState({
    adminPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    admin: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({
    adminPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setFormData({
        adminPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({
        adminPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswords({
        admin: false,
        new: false,
        confirm: false,
      });
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors = {
      adminPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!formData.adminPassword) {
      newErrors.adminPassword = "Admin password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm the new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!validateForm()) {
      return;
    }

    try {
      await execute(() =>
        apiService.changeUserPassword(
          user.id,
          formData.adminPassword,
          formData.newPassword,
          formData.confirmPassword
        )
      );

      toast({
        title: "Success",
        description: `Password changed successfully for ${user.name}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to change password:", error);

      // Handle specific error messages from backend
      if (error?.message?.includes("Incorrect admin password")) {
        setErrors((prev) => ({
          ...prev,
          adminPassword: "Incorrect admin password",
        }));
        toast({
          title: "Error",
          description: "Incorrect admin password. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to change password",
          variant: "destructive",
        });
      }
    }
  };

  const togglePasswordVisibility = (field: "admin" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <DialogTitle>Change Password</DialogTitle>
          </div>
          <DialogDescription>
            {user && (
              <>
                Change password for <strong>{user.name}</strong>
                <br />
                Enter your admin password to confirm this action.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Password */}
          <div className="space-y-2">
            <Label htmlFor="admin-password">Your Admin Password *</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPasswords.admin ? "text" : "password"}
                placeholder="Enter your password to confirm"
                value={formData.adminPassword}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    adminPassword: e.target.value,
                  }));
                  setErrors((prev) => ({ ...prev, adminPassword: "" }));
                }}
                className={errors.adminPassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility("admin")}
              >
                {showPasswords.admin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.adminPassword && (
              <p className="text-sm text-red-500">{errors.adminPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">
              New Password for {user?.name} *
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? "text" : "password"}
                placeholder="Enter new password (min 6 characters)"
                value={formData.newPassword}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }));
                  setErrors((prev) => ({ ...prev, newPassword: "" }));
                }}
                className={errors.newPassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility("new")}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password *</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? "text" : "password"}
                placeholder="Re-enter the new password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }));
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
