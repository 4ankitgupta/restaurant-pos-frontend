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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  AlertCircle,
  Clock,
  TrendingUp,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

export const ExpenseDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    categoryId: "all",
    status: "all",
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: () => apiService.getExpenseCategories(),
  });

  // Fetch expenses
  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses", filters],
    queryFn: () =>
      apiService.getExpenses({
        ...filters,
        categoryId: filters.categoryId === "all" ? "" : filters.categoryId,
        status: filters.status === "all" ? "" : filters.status,
      }),
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ["expenseAnalytics", filters.startDate, filters.endDate],
    queryFn: () =>
      apiService.getExpenseAnalytics(filters.startDate, filters.endDate),
  });

  const categories = categoriesData?.data || [];
  const expenses = expensesData?.data || [];
  const analytics = analyticsData?.data || {};
  
  // Show loading state for initial load
  const isInitialLoading = loadingExpenses && expenses.length === 0;

  // Create expense mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseAnalytics"] });
      toast({ title: "Expense created successfully" });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update expense mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiService.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseAnalytics"] });
      toast({ title: "Expense updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedExpense(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete expense mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseAnalytics"] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PAID: { variant: "default", className: "bg-green-500" },
      PENDING: { variant: "secondary", className: "bg-yellow-500" },
      OVERDUE: { variant: "destructive", className: "bg-red-500" },
    };
    const config = variants[status] || variants.PAID;
    return (
      <Badge {...config} className="text-white">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{Number(analytics.totalExpenses || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.pendingBills || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {analytics.overdueBills || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Largest Category
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.largestCategory?.categoryName || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              ₹
              {Number(
                analytics.largestCategory?.totalAmount || 0
              ).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Add Button */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Expenses</CardTitle>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Row */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    categoryId: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
            
            {/* Clear Filters Button */}
            {(filters.startDate || filters.endDate || filters.categoryId !== "all" || filters.status !== "all") && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      startDate: "",
                      endDate: "",
                      categoryId: "all",
                      status: "all",
                    })
                  }
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Expenses Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span>Loading expenses...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {filters.startDate || filters.endDate || filters.categoryId !== "all" || filters.status !== "all"
                        ? "No expenses found matching your filters. Try adjusting the filters."
                        : "No expenses recorded yet. Click 'Add Expense' to create your first entry."}
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {format(new Date(expense.expenseDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        {expense.category ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: expense.category.color,
                              }}
                            />
                            {expense.category.name}
                          </div>
                        ) : (
                          "Uncategorized"
                        )}
                      </TableCell>
                      <TableCell>
                        ₹{Number(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>{expense.paymentMethod || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedExpense(expense);
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
                                  "Are you sure you want to delete this expense?"
                                )
                              ) {
                                deleteMutation.mutate(expense.id);
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
      <ExpenseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        categories={categories}
        title="Add Expense"
        isLoading={createMutation.isPending}
      />

      <ExpenseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={(data) =>
          updateMutation.mutate({ id: selectedExpense?.id, data })
        }
        categories={categories}
        expense={selectedExpense}
        title="Edit Expense"
        isLoading={updateMutation.isPending}
      />
    </div>
  );
};

// Expense Dialog Component
interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  categories: any[];
  expense?: any;
  title: string;
  isLoading: boolean;
}

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  categories,
  expense,
  title,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    status: "PAID",
    paymentMethod: "",
    paidBy: "",
    referenceNo: "",
    categoryId: "",
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || "",
        amount: expense.amount || "",
        expenseDate: expense.expenseDate
          ? new Date(expense.expenseDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        status: expense.status || "PAID",
        paymentMethod: expense.paymentMethod || "",
        paidBy: expense.paidBy || "",
        referenceNo: expense.referenceNo || "",
        categoryId: expense.categoryId || "",
      });
    } else {
      setFormData({
        description: "",
        amount: "",
        expenseDate: new Date().toISOString().split("T")[0],
        status: "PAID",
        paymentMethod: "",
        paidBy: "",
        referenceNo: "",
        categoryId: "",
      });
    }
  }, [expense, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      expenseDate: new Date(formData.expenseDate).toISOString(),
      status: formData.status,
    };
    
    // Only include optional fields if they have values
    if (formData.categoryId) payload.categoryId = formData.categoryId;
    if (formData.paymentMethod) payload.paymentMethod = formData.paymentMethod;
    if (formData.paidBy) payload.paidBy = formData.paidBy;
    if (formData.referenceNo) payload.referenceNo = formData.referenceNo;
    
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {expense ? "Update expense details" : "Add a new expense entry"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                placeholder="e.g., Monthly Electricity Bill"
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
            <div className="space-y-2">
              <Label htmlFor="expenseDate">Date *</Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) =>
                  setFormData({ ...formData, expenseDate: e.target.value })
                }
                max={new Date().toISOString().split("T")[0]}
                required
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="WALLET">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid By</Label>
              <Input
                id="paidBy"
                value={formData.paidBy}
                onChange={(e) =>
                  setFormData({ ...formData, paidBy: e.target.value })
                }
                placeholder="Manager Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNo">Reference Number</Label>
              <Input
                id="referenceNo"
                value={formData.referenceNo}
                onChange={(e) =>
                  setFormData({ ...formData, referenceNo: e.target.value })
                }
                placeholder="Transaction ID"
              />
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
              {isLoading ? "Saving..." : expense ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
