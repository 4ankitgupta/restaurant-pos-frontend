import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { superAdminApi, Restaurant } from "@/services/superAdminApiService";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Building, Edit, Users, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RestaurantForm } from "./RestaurantForm";
import { useIsMobile } from "@/hooks/use-mobile";

export const ManageRestaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null
  );
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const data = await superAdminApi.getRestaurants();
      setRestaurants(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch restaurants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleStatusChange = async (id: string, newStatus: boolean) => {
    // Optimistic update
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: newStatus } : r))
    );

    try {
      await superAdminApi.updateRestaurantStatus(id, newStatus);
      toast({
        title: "Success",
        description: `Restaurant ${newStatus ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      // Rollback on error
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !newStatus } : r))
      );
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingRestaurant(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRestaurant(null);
  };

  const onViewUsers = (restaurantId: string) => {
    navigate(`/super-admin/restaurants/${restaurantId}/users`);
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building className="w-6 h-6" />
              Restaurants
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all restaurants
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <RestaurantForm
              initialData={editingRestaurant}
              onClose={closeDialog}
              onSuccess={() => {
                fetchRestaurants();
              }}
            />
          </Dialog>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          ) : restaurants.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No restaurants found. Create your first one to get started.
              </CardContent>
            </Card>
          ) : (
            restaurants.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {restaurant.email || "No email"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {restaurant.phone || "No phone"}
                      </p>
                    </div>
                    <Switch
                      checked={restaurant.isActive}
                      onCheckedChange={(newStatus) =>
                        handleStatusChange(restaurant.id, newStatus)
                      }
                      aria-label="Restaurant status"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant={
                        restaurant.subscription?.status === "ACTIVE"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {restaurant.subscription?.status || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(restaurant)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewUsers(restaurant.id)}
                      className="flex-1"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="w-8 h-8" />
            Restaurant Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Onboard, view, and manage all restaurants on the platform
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Restaurant
            </Button>
          </DialogTrigger>
          <RestaurantForm
            initialData={editingRestaurant}
            onClose={closeDialog}
            onSuccess={() => {
              fetchRestaurants();
            }}
          />
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : restaurants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No restaurants found. Create your first one to get started.
                </TableCell>
              </TableRow>
            ) : (
              restaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell className="font-medium">
                    {restaurant.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {restaurant.email ?? "No email"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {restaurant.phone ?? "No phone"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        restaurant.subscription?.status === "ACTIVE"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {restaurant.subscription?.status ?? "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={restaurant.isActive}
                      onCheckedChange={(newStatus) =>
                        handleStatusChange(restaurant.id, newStatus)
                      }
                      aria-label="Restaurant status"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewUsers(restaurant.id)}
                        title="View Users"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(restaurant)}
                        title="Edit Restaurant"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(
                            `/super-admin/subscriptions?restaurantId=${restaurant.id}`
                          )
                        }
                        title="View Subscription"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
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
