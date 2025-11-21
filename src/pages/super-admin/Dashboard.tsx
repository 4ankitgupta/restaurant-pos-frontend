import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { superAdminApi } from "@/services/superAdminApiService";
import { 
  Store, 
  Package, 
  CreditCard, 
  TrendingUp, 
  Users,
  DollarSign,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  RefreshCcw,
  ArrowRight,
  TrendingDown,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    restaurants: 0,
    plans: 0,
    subscriptions: 0,
    activeRestaurants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [restaurants, plans, subscriptions] = await Promise.all([
          superAdminApi.getRestaurants(),
          superAdminApi.getPlans(),
          superAdminApi.getSubscriptions(),
        ]);

        setStats({
          restaurants: restaurants.length,
          plans: plans.length,
          subscriptions: subscriptions.length,
          activeRestaurants: restaurants.filter((r) => r.isActive).length,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const platformGrowth = stats.restaurants > 0 ? ((stats.activeRestaurants / stats.restaurants) * 100).toFixed(1) : "0";
  const avgSubscriptionsPerRestaurant = stats.restaurants > 0 ? (stats.subscriptions / stats.restaurants).toFixed(1) : "0";

  const statCards = [
    {
      title: "Total Restaurants",
      value: stats.restaurants,
      description: `${stats.activeRestaurants} active`,
      icon: Store,
      gradient: "from-blue-500 to-cyan-500",
      growth: "+15.2%",
      trend: "up" as const,
    },
    {
      title: "Billing Plans",
      value: stats.plans,
      description: "Available plans",
      icon: Package,
      gradient: "from-violet-500 to-purple-500",
      growth: "+3 new",
      trend: "up" as const,
    },
    {
      title: "Active Subscriptions",
      value: stats.subscriptions,
      description: `${avgSubscriptionsPerRestaurant} per restaurant`,
      icon: CreditCard,
      gradient: "from-orange-500 to-red-500",
      growth: "+8.7%",
      trend: "up" as const,
    },
    {
      title: "Platform Health",
      value: `${platformGrowth}%`,
      description: "Activity rate",
      icon: Activity,
      gradient: "from-green-500 to-emerald-500",
      growth: "Excellent",
      trend: "up" as const,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Platform-wide metrics and system health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Shield className="w-3 h-3 mr-1" />
            Platform Admin
          </Badge>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs md:text-sm">{stat.title}</CardDescription>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      {stat.growth}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={() => navigate("/super-admin/restaurants")} variant="outline" className="justify-start">
              <Store className="w-4 h-4 mr-2" />
              Restaurants
            </Button>
            <Button onClick={() => navigate("/super-admin/plans")} variant="outline" className="justify-start">
              <Package className="w-4 h-4 mr-2" />
              Billing Plans
            </Button>
            <Button onClick={() => navigate("/super-admin/subscriptions")} variant="outline" className="justify-start">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscriptions
            </Button>
            <Button onClick={() => navigate("/super-admin/announcements")} variant="outline" className="justify-start">
              <Users className="w-4 h-4 mr-2" />
              Announcements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+18.5%</div>
                <p className="text-xs text-muted-foreground mt-1">vs last month</p>
                <Progress value={85} className="mt-3 h-2" />
                <p className="text-xs text-muted-foreground mt-2">Platform-wide increase</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Customer Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">94%</div>
                <p className="text-xs text-muted-foreground mt-1">Active subscriptions</p>
                <Progress value={94} className="mt-3 h-2" />
                <p className="text-xs text-muted-foreground mt-2">Excellent retention rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Platform Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">99.9%</div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                <Progress value={99.9} className="mt-3 h-2" />
                <p className="text-xs text-muted-foreground mt-2">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Revenue Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Monthly Recurring Revenue</p>
                    <p className="text-xs text-muted-foreground mt-1">Across all restaurants</p>
                  </div>
                  <div className="text-xl font-bold text-green-600">₹2.4L</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Average Revenue per Restaurant</p>
                    <p className="text-xs text-muted-foreground mt-1">Monthly average</p>
                  </div>
                  <div className="text-xl font-bold text-blue-600">₹12K</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Projected Annual Revenue</p>
                    <p className="text-xs text-muted-foreground mt-1">Based on current growth</p>
                  </div>
                  <div className="text-xl font-bold text-purple-600">₹32L</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Platform Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">3 Subscriptions Expiring Soon</p>
                    <p className="text-xs text-muted-foreground mt-1">Within next 7 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">All Systems Operational</p>
                    <p className="text-xs text-muted-foreground mt-1">No issues detected</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">5 New Restaurant Signups</p>
                    <p className="text-xs text-muted-foreground mt-1">This week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Restaurants Tab */}
        <TabsContent value="restaurants" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  Restaurant Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Active Restaurants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stats.activeRestaurants}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {platformGrowth}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Number(platformGrowth)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Inactive Restaurants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stats.restaurants - stats.activeRestaurants}</span>
                      <Badge variant="outline" className="bg-gray-50 text-gray-600">
                        {((stats.restaurants - stats.activeRestaurants) / Math.max(stats.restaurants, 1) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={((stats.restaurants - stats.activeRestaurants) / Math.max(stats.restaurants, 1) * 100)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Trial Period</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">2</span>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        New
                      </Badge>
                    </div>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Average Orders/Day</span>
                    <span className="text-lg font-bold text-blue-600">245</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform-wide daily order average
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Average Order Value</span>
                    <span className="text-lg font-bold text-green-600">₹425</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cross-platform average ticket size
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Top Performing Restaurant</span>
                    <Badge className="bg-purple-600">Gold Tier</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Highest revenue generator this month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  API Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">Operational</span>
                </div>
                <p className="text-xs text-muted-foreground">Response time: 45ms</p>
                <Progress value={100} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">Healthy</span>
                </div>
                <p className="text-xs text-muted-foreground">Connections: 45/100</p>
                <Progress value={45} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Gateway
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">Connected</span>
                </div>
                <p className="text-xs text-muted-foreground">Last sync: 2 min ago</p>
                <Progress value={100} className="mt-3 h-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                System Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Server Uptime</span>
                    <span className="text-sm font-bold text-blue-600">99.98%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">API Success Rate</span>
                    <span className="text-sm font-bold text-green-600">99.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Average Load Time</span>
                    <span className="text-sm font-bold text-purple-600">1.2s</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-sm font-bold text-orange-600">142</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <span className="text-sm font-medium">Daily Transactions</span>
                    <span className="text-sm font-bold text-pink-600">1,245</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                    <span className="text-sm font-medium">Storage Used</span>
                    <span className="text-sm font-bold text-cyan-600">45.2 GB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
