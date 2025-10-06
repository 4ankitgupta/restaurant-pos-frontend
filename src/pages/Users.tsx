import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  Users as UsersIcon,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { UserForm } from "@/components/user/UserForm";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN_STAFF";
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const { loading: usersLoading, execute: executeGetUsers } = useApi<User[]>();

  const { loading: deleteLoading, execute: executeDelete } = useApi();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await executeGetUsers(() => apiService.getUsers());
      if (response) {
        setUsers(response);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await executeDelete(() => apiService.deleteUser(userId));
      toast({ title: "Success", description: "User deleted successfully" });
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const getRoleBadgeVariant = (role: User["role"]) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "MANAGER":
        return "default";
      case "CASHIER":
        return "secondary";
      case "WAITER":
        return "outline";
      case "KITCHEN_STAFF":
        return "outline";
      default:
        return "outline";
    }
  };

  const filteredUsers =
    selectedRole === "all"
      ? users
      : users.filter((user) => user.role === selectedRole);

  const loading = usersLoading || deleteLoading;

  const roles = ["ADMIN", "MANAGER", "CASHIER", "WAITER", "KITCHEN_STAFF"];
  const roleDisplayNames = {
    ADMIN: "Administrator",
    MANAGER: "Manager",
    CASHIER: "Cashier",
    WAITER: "Waiter",
    KITCHEN_STAFF: "Kitchen Staff",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => setIsUserFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
        <UserForm
          open={isUserFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUser(null);
            }
            setIsUserFormOpen(open);
          }}
          onSuccess={fetchUsers}
          editingUser={editingUser}
        />
      </div>

      {/* Role Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedRole === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRole("all")}
            >
              All Users ({users.length})
            </Button>
            {roles.map((role) => {
              const userCount = users.filter(
                (user) => user.role === role
              ).length;
              return (
                <Button
                  key={role}
                  variant={selectedRole === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRole(role)}
                >
                  {roleDisplayNames[role as keyof typeof roleDisplayNames]} (
                  {userCount})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {roleDisplayNames[user.role]}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{user.name}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 mr-2" />
                  User ID: {user.id.slice(0, 8)}...
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
            <p className="text-muted-foreground">
              {selectedRole === "all"
                ? "No users found. Add some users to get started."
                : "No users with this role. Try selecting a different role."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Users;
