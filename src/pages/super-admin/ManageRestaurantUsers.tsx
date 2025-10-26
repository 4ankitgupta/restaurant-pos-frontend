import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  superAdminApi,
  RestaurantUser,
  Restaurant,
  SuperAdminApiError,
} from "@/services/superAdminApiService";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Users, Building, ArrowLeft, LogIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/config/apiConfig"; // Import your restaurant app's base URL config

export const ManageRestaurantUsers: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<RestaurantUser[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      toast({
        title: "Error",
        description: "No restaurant ID provided",
        variant: "destructive",
      });
      navigate("/super-admin/restaurants");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const usersData = await superAdminApi.getRestaurantUsers(restaurantId);
        const restaurantData = await superAdminApi.getRestaurant(restaurantId);
        setUsers(usersData);
        setRestaurant(restaurantData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch restaurant users",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, navigate]);

  const handleImpersonate = async (userId: string) => {
    setIsImpersonating(userId);
    try {
      const { accessToken } = await superAdminApi.impersonateUser(userId);

      // Open the login page of the *main app* in a new tab,
      // passing the token as a URL parameter.
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("impersonation_token", accessToken);

      window.open(loginUrl.href, "_blank");

      toast({
        title: "Success",
        description: "Impersonation session started in a new tab.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          (error as SuperAdminApiError).message || "Impersonation failed",
        variant: "destructive",
      });
    } finally {
      setIsImpersonating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/super-admin/restaurants")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8" />
            Restaurant Users
          </h1>
          <p className="text-muted-foreground mt-2">
            Viewing users for{" "}
            {isLoading ? (
              <Skeleton className="h-4 w-32 inline-block" />
            ) : (
              <strong>{restaurant?.name}</strong>
            )}
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No users found for this restaurant.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isImpersonating === user.id}
                      onClick={() => handleImpersonate(user.id)}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {isImpersonating === user.id
                        ? "Logging in..."
                        : "Login as User"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
