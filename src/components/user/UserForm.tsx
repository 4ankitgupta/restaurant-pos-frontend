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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN_STAFF";
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingUser: User | null;
}

export const UserForm: React.FC<UserFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editingUser,
}) => {
  const { loading: createLoading, execute: executeCreate } = useApi();
  const { loading: updateLoading, execute: executeUpdate } = useApi();

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "" as User["role"] | "",
  });

  useEffect(() => {
    if (editingUser) {
      setUserForm({
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone || "",
        password: "", // Don't show existing password
        role: editingUser.role,
      });
    } else {
      setUserForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "",
      });
    }
  }, [editingUser, open]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await executeCreate(() =>
        apiService.register({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          password: userForm.password,
          role: userForm.role as string,
        })
      );
      toast({ title: "Success", description: "User created successfully" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await executeUpdate(() =>
        apiService.updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role as string,
        })
      );
      toast({ title: "Success", description: "User updated successfully" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const loading = createLoading || updateLoading;

  const roles = ["MANAGER", "CASHIER", "WAITER", "KITCHEN_STAFF"];
  const roleDisplayNames = {
    MANAGER: "Manager",
    CASHIER: "Cashier",
    WAITER: "Waiter",
    KITCHEN_STAFF: "Kitchen Staff",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Update the user's details below."
              : "Fill in the form to create a new user."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={userForm.name}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="user-phone">Phone</Label>
            <Input
              id="user-phone"
              value={userForm.phone}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </div>
          {!editingUser && (
            <div>
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required={!editingUser}
              />
            </div>
          )}
          <div>
            <Label htmlFor="user-role">Role</Label>
            <Select
              value={userForm.role}
              onValueChange={(value) =>
                setUserForm((prev) => ({
                  ...prev,
                  role: value as User["role"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleDisplayNames[role as keyof typeof roleDisplayNames]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {editingUser ? "Update User" : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
