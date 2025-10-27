import React, { useEffect, useState } from "react";
import { superAdminApi, Plan } from "@/services/superAdminApiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import { Plus, Package, Edit, Trash2, IndianRupee } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

export const ManagePlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    features: "",
  });
  const isMobile = useIsMobile();

  const fetchPlans = async () => {
    try {
      const data = await superAdminApi.getPlans();
      setPlans(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch plans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      features: Object.entries(plan.features)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    setFormData({ name: "", price: "", features: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const featuresObject = formData.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
      .reduce((acc, line) => {
        const parts = line.split(":");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(":").trim();
          acc[key] = isNaN(Number(value)) ? value : Number(value);
        }
        return acc;
      }, {} as { [key: string]: any });

    try {
      if (editingPlan) {
        await superAdminApi.updatePlan(editingPlan.id, {
          name: formData.name,
          price: parseFloat(formData.price),
          features: featuresObject,
        });
        toast({
          title: "Success",
          description: "Plan updated successfully",
        });
      } else {
        await superAdminApi.createPlan({
          name: formData.name,
          price: parseFloat(formData.price),
          features: featuresObject,
        });
        toast({
          title: "Success",
          description: "Plan created successfully",
        });
      }
      closeDialog();
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Operation failed",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await superAdminApi.deletePlan(id);
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      setDeletingPlanId(null);
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6" />
              Plans
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage billing plans
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPlan(null)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? "Edit Plan" : "Create New Plan"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlan
                      ? "Update the plan details"
                      : "Add a new billing plan"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Basic, Pro, Enterprise"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹/month)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="features">Features (one per line)</Label>
                    <Textarea
                      id="features"
                      value={formData.features}
                      onChange={(e) =>
                        setFormData({ ...formData, features: e.target.value })
                      }
                      placeholder="users: 5&#10;orders: unlimited&#10;support: email"
                      rows={6}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No plans found. Create your first plan to get started.
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <div className="flex items-center text-lg font-bold text-primary mt-1">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        {parseFloat(plan.price).toFixed(2)}
                        <span className="text-xs text-muted-foreground ml-1">/month</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {Object.entries(plan.features).slice(0, 2).map(([key, value]) => (
                      <div key={key}>• {key}: {String(value)}</div>
                    ))}
                    {Object.keys(plan.features).length > 2 && (
                      <div className="text-xs">+{Object.keys(plan.features).length - 2} more</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(plan)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingPlanId(plan.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-3 h-3 mr-1 text-destructive" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <AlertDialog
          open={!!deletingPlanId}
          onOpenChange={() => setDeletingPlanId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingPlanId && handleDelete(deletingPlanId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-8 h-8" />
            Billing Plans
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage subscription plans for restaurants
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPlan(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit Plan" : "Create New Plan"}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan
                    ? "Update the plan details"
                    : "Add a new billing plan"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Basic, Pro, Enterprise"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹/month)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) =>
                      setFormData({ ...formData, features: e.target.value })
                    }
                    placeholder="users: 5&#10;orders: unlimited&#10;support: email"
                    rows={6}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No plans found. Create your first plan to get started.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <IndianRupee className="w-3 h-3 mr-1" />
                      {parseFloat(plan.price).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(plan.features).slice(0, 2).join(", ")}
                      {Object.keys(plan.features).length > 2 &&
                        ` +${Object.keys(plan.features).length - 2} more`}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingPlanId(plan.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deletingPlanId}
        onOpenChange={() => setDeletingPlanId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlanId && handleDelete(deletingPlanId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
