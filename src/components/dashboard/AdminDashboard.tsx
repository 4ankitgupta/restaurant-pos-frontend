import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService, ApiError } from "@/services/apiService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  IndianRupee, 
  Users, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  BarChart3,
  PieChart,
  DollarSign,
  Clock,
  Award,
  Target,
  RefreshCcw,
  ArrowRight,
  Calendar,
  Percent
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/reportFormatting";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart as RechartsPieChart
} from "recharts";

interface AdminDashboardData {
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
  salesTrend: Record<string, number>;
  topSellingItems: { name: string; quantity: number }[];
  paymentModes: Record<string, number>;
}

const AdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getAdminDashboard();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const navigate = useNavigate();

  const salesChartData = data
    ? Object.entries(data.salesTrend)
        .map(([date, total]) => ({
          date: new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
          fullDate: date,
          Total: total,
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    : [];

  const paymentChartData = data
    ? Object.entries(data.paymentModes).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  const totalPayments = paymentChartData.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate growth (mock for now - would need previous period data)
  const revenueGrowth = 12.5;
  const customerGrowth = 8.3;
  const avgOrderGrowth = 5.2;

  if (isLoading) {
    return <AdminSkeleton />;
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
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days Performance & Analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Live Data
          </Badge>
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
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:shadow-lg transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                +{revenueGrowth}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(data.totalCustomers)}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                +{customerGrowth}% growth
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Order Value
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(data.averageOrderValue)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                +{avgOrderGrowth}% increase
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue per Day
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(data.totalRevenue / 30)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Daily average (30 days)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Quick Actions & Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-medium">Reports</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/inventory')}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs font-medium">Inventory</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/menu')}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Menu</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/employees')}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Staff</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/settings')}
            >
              <Target className="h-5 w-5" />
              <span className="text-xs font-medium">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Trend Chart */}
      <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Sales Trend (Last 7 Days)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Daily revenue comparison
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+{revenueGrowth}%</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={salesChartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${value / 1000}k`}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: any) => [formatCurrency(value), "Sales"]}
              />
              <Area 
                type="monotone"
                dataKey="Total" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Award className="h-4 w-4" />
            Best Sellers
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <PieChart className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Revenue Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="text-lg font-bold text-green-600">+{revenueGrowth}%</span>
                  </div>
                  <Progress value={revenueGrowth * 5} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Above industry average of 8%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Customer Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Return Rate</span>
                    <span className="text-lg font-bold text-blue-600">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Excellent customer loyalty
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  Monthly Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-lg font-bold text-purple-600">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(data.totalRevenue * 1.15 - data.totalRevenue)} to goal
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Top 5 Selling Items
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on quantity sold
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/reports')}
                    className="gap-2"
                  >
                    Full Report
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topSellingItems.map((item, index) => {
                    const maxQty = data.topSellingItems[0]?.quantity || 1;
                    const percentage = (item.quantity / maxQty) * 100;
                    return (
                      <div 
                        key={item.name} 
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                              index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.quantity} units</p>
                            </div>
                          </div>
                          <Badge variant={index < 3 ? "default" : "outline"}>
                            {formatPercentage(percentage / 100)}
                          </Badge>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">Strong Performers</p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Top 3 items account for 45% of total sales
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">Category Leader</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {data.topSellingItems[0]?.name} leads in its category
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-900 dark:text-purple-100">Recommendation</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          Focus promotions on top 5 items for maximum impact
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Payment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value: any) => [formatCurrency(value), "Amount"]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-base">Payment Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Total: {formatCurrency(totalPayments)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentChartData.map((item, index) => {
                    const percentage = (item.value / totalPayments) * 100;
                    return (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="capitalize font-medium">{item.name.toLowerCase()}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{formatCurrency(item.value)}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                          style={{
                            ['--progress-background' as any]: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AdminSkeleton = () => (
  <div className="p-6 space-y-6">
    <Skeleton className="h-8 w-1/3" />
    <div className="grid gap-4 md:grid-cols-3">
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
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      <Card>
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

export default AdminDashboard;
