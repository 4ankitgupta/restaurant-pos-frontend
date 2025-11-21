import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiService, ApiError } from "@/services/apiService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  IndianRupee,
  UtensilsCrossed,
  AlertCircle,
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  Package,
  ChefHat,
  ClipboardList,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/reportFormatting";

interface ManagerDashboardData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  tableStatus: {
    occupied: number;
    available: number;
    needsCleaning: number;
    total: number;
  };
  activeOrders: number;
  lowStockItems: {
    id: string;
    name: string;
    currentStock: number;
    unit: string;
  }[];
}

const ManagerDashboard = () => {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getManagerDashboard();
        setData(response.data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "Failed to fetch dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const tableOccupancyRate = data
    ? Math.round((data.tableStatus.occupied / data.tableStatus.total) * 100)
    : 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="w-1/2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Manager Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Performance - Live Updates
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Today's sales</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed today
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Order Value
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Orders
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {data.activeOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In kitchen now</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate("/reports")}
            >
              <ClipboardList className="h-5 w-5" />
              <span className="text-xs font-medium">View Reports</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate("/inventory")}
            >
              <Package className="h-5 w-5" />
              <span className="text-xs font-medium">Inventory</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate("/employees")}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Staff</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate("/tables")}
            >
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-xs font-medium">Tables</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Table Status */}
        <Card className="lg:col-span-1 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live Table Status
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {tableOccupancyRate}% Occupancy Rate
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Occupancy</span>
                <span className="font-medium">{tableOccupancyRate}%</span>
              </div>
              <Progress value={tableOccupancyRate} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <span className="font-medium text-red-700 dark:text-red-400">
                  Occupied
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {data.tableStatus.occupied}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    / {data.tableStatus.total}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <span className="font-medium text-green-700 dark:text-green-400">
                  Available
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-green-600 text-green-600"
                  >
                    {data.tableStatus.available}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    / {data.tableStatus.total}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                <span className="font-medium text-yellow-700 dark:text-yellow-400">
                  Needs Cleaning
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-yellow-600 text-yellow-600"
                  >
                    {data.tableStatus.needsCleaning}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    / {data.tableStatus.total}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={() => navigate("/tables")}
            >
              Manage Tables
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow border-l-4 border-l-destructive">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  Low Stock Alerts
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.lowStockItems.length} item
                  {data.lowStockItems.length !== 1 ? "s" : ""} need
                  {data.lowStockItems.length === 1 ? "s" : ""} attention
                </p>
              </div>
              {data.lowStockItems.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/inventory")}
                  className="gap-2"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.lowStockItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        Current Stock
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.lowStockItems.slice(0, 5).map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive font-bold text-sm">
                            {item.currentStock} {item.unit}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {data.lowStockItems.length > 5 && (
                  <div className="text-center mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/inventory")}
                      className="gap-2 text-muted-foreground hover:text-primary"
                    >
                      View {data.lowStockItems.length - 5} more items
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-muted-foreground font-medium">
                  🎉 All items are well-stocked!
                </p>
                <p className="text-sm text-muted-foreground">
                  No inventory alerts at this time
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <IndianRupee className="h-4 w-4" />
                Revenue Pace
              </div>
              <p className="text-lg font-bold">
                {formatCurrency(data.totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.totalOrders > 0
                  ? "On track for daily target"
                  : "Start taking orders"}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ChefHat className="h-4 w-4" />
                Kitchen Load
              </div>
              <p className="text-lg font-bold">{data.activeOrders} Active</p>
              <p className="text-xs text-muted-foreground">
                {data.activeOrders > 10
                  ? "High volume - monitor closely"
                  : "Normal capacity"}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <UtensilsCrossed className="h-4 w-4" />
                Table Turnover
              </div>
              <p className="text-lg font-bold">{tableOccupancyRate}%</p>
              <p className="text-xs text-muted-foreground">
                {tableOccupancyRate > 80
                  ? "High demand"
                  : tableOccupancyRate > 50
                  ? "Moderate traffic"
                  : "Low occupancy"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <Skeleton className="h-8 w-1/3" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export default ManagerDashboard;
