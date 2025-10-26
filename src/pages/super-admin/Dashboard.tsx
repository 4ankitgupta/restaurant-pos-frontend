import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { superAdminApi } from "@/services/superAdminApiService";
import { Store, Package, CreditCard, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    restaurants: 0,
    plans: 0,
    subscriptions: 0,
    activeRestaurants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const statCards = [
    {
      title: "Total Restaurants",
      value: stats.restaurants,
      description: `${stats.activeRestaurants} active`,
      icon: Store,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Billing Plans",
      value: stats.plans,
      description: "Available plans",
      icon: Package,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Active Subscriptions",
      value: stats.subscriptions,
      description: "Total subscriptions",
      icon: CreditCard,
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Platform Growth",
      value: "+12%",
      description: "This month",
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>{stat.title}</CardDescription>
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}
                >
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Create new restaurants
            </p>
            <p className="text-sm text-muted-foreground">
              • Manage billing plans
            </p>
            <p className="text-sm text-muted-foreground">
              • Send announcements
            </p>
            <p className="text-sm text-muted-foreground">
              • Configure platform settings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Status</span>
              <span className="text-sm font-medium text-green-600">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-sm font-medium text-green-600">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Gateway</span>
              <span className="text-sm font-medium text-green-600">
                Connected
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
