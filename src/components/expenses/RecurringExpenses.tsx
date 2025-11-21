import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/apiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Calendar, Repeat, DollarSign } from "lucide-react";
import { format } from "date-fns";

export const RecurringExpenses: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<any>(null);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: () => apiService.getExpenseCategories(),
  });

  // Fetch recurring expenses
  const { data: recurringData, isLoading: loadingRecurring } = useQuery({
    queryKey: ["recurringExpenses"],
    queryFn: () => apiService.getRecurringExpenses(),
  });

  const categories = categoriesData?.data || [];
  const recurringExpenses = recurringData?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiService.createRecurringExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringExpenses"] });
      toast({ title: "Recurring expense created successfully" });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create recurring expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiService.updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringExpenses"] });
      toast({ title: "Recurring expense updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedRecurring(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update recurring expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteRecurringExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringExpenses"] });
      toast({ title: "Recurring expense deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete recurring expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getIntervalBadge = (interval: string) => {
    const colors: Record<string, string> = {
      DAILY: "bg-blue-500",
      WEEKLY: "bg-green-500",
      MONTHLY: "bg-purple-500",
      QUARTERLY: "bg-orange-500",
      YEARLY: "bg-red-500",
    };
    return (
      <Badge className={`${colors[interval]} text-white`}>{interval}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              <CardTitle>Recurring Expenses</CardTitle>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recurring Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRecurring ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : recurringExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No recurring expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  recurringExpenses.map((recurring: any) => (
                    <TableRow key={recurring.id}>
                      <TableCell className="font-medium">
                        {recurring.name}
                      </TableCell>
                      <TableCell>{recurring.description || "-"}</TableCell>
                      <TableCell>
                        {recurring.category ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: recurring.category.color,
                              }}
                            />
                            {recurring.category.name}
                          </div>
                        ) : (
                          "Uncategorized"
                        )}
                      </TableCell>
                      <TableCell>
                        ₹{Number(recurring.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getIntervalBadge(recurring.interval)}
                      </TableCell>
                      <TableCell>
                        {recurring.nextRunDate
                          ? format(
                              new Date(recurring.nextRunDate),
                              "MMM dd, yyyy"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={recurring.isActive}
                          onCheckedChange={(checked) => {
                            updateMutation.mutate({
                              id: recurring.id,
                              data: { isActive: checked },
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecurring(recurring);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this recurring expense?"
                                )
                              ) {
                                deleteMutation.mutate(recurring.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialogs */}
      <RecurringExpenseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        categories={categories}
        title="Add Recurring Expense"
        isLoading={createMutation.isPending}
      />

      <RecurringExpenseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={(data) =>
          updateMutation.mutate({ id: selectedRecurring?.id, data })
        }
        categories={categories}
        recurring={selectedRecurring}
        title="Edit Recurring Expense"
        isLoading={updateMutation.isPending}
      />
    </div>
  );
};

// Recurring Expense Dialog Component
interface RecurringExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  categories: any[];
  recurring?: any;
  title: string;
  isLoading: boolean;
}

const RecurringExpenseDialog: React.FC<RecurringExpenseDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  categories,
  recurring,
  title,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    interval: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    categoryId: "",
    dayOfMonth: "",
    dayOfWeek: "",
    isActive: true,
  });

  useEffect(() => {
    if (recurring) {
      setFormData({
        name: recurring.name || "",
        description: recurring.description || "",
        amount: recurring.amount || "",
        interval: recurring.interval || "MONTHLY",
        startDate: recurring.startDate
          ? new Date(recurring.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        endDate: recurring.endDate
          ? new Date(recurring.endDate).toISOString().split("T")[0]
          : "",
        categoryId: recurring.categoryId || "",
        dayOfMonth: recurring.dayOfMonth?.toString() || "",
        dayOfWeek: recurring.dayOfWeek?.toString() || "",
        isActive: recurring.isActive !== undefined ? recurring.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        amount: "",
        interval: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        categoryId: "",
        dayOfMonth: "",
        dayOfWeek: "",
        isActive: true,
      });
    }
  }, [recurring, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      interval: formData.interval,
      startDate: new Date(formData.startDate).toISOString(),
      isActive: formData.isActive,
    };

    // Only include optional fields if they have values
    if (formData.description) payload.description = formData.description;
    if (formData.categoryId) payload.categoryId = formData.categoryId;
    if (formData.endDate) payload.endDate = new Date(formData.endDate).toISOString();

    if (formData.interval === "MONTHLY" && formData.dayOfMonth) {
      payload.dayOfMonth = parseInt(formData.dayOfMonth);
    }
    if (formData.interval === "WEEKLY" && formData.dayOfWeek) {
      payload.dayOfWeek = parseInt(formData.dayOfWeek);
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {recurring
              ? "Update recurring expense details"
              : "Set up a recurring expense that will be generated automatically"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Monthly Rent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Additional details about this recurring expense"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval">Frequency *</Label>
              <Select
                value={formData.interval}
                onValueChange={(value) =>
                  setFormData({ ...formData, interval: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.interval === "MONTHLY" && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Day of Month (1-31)</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) =>
                    setFormData({ ...formData, dayOfMonth: e.target.value })
                  }
                  placeholder="e.g., 1 for first of month"
                />
              </div>
            )}

            {formData.interval === "WEEKLY" && (
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dayOfWeek: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Inactive recurring expenses will not generate new expenses
                automatically
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : recurring ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
