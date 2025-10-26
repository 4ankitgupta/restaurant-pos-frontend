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
import { RestaurantForm } from "./RestaurantForm"; // UPDATED: Import the new form

export const ManageRestaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null
  );
  const navigate = useNavigate();

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
          {/* Use the new form component */}
          <RestaurantForm
            initialData={editingRestaurant}
            onClose={closeDialog}
            onSuccess={() => {
              fetchRestaurants();
            }}
          />
        </Dialog>
      </div>

      <div className="border rounded-lg">
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
                      {/* Add other actions like View Subscriptions if needed */}
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
