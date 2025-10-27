import React, { useEffect, useState } from 'react';
import { superAdminApi, Subscription, Restaurant, Plan } from '@/services/superAdminApiService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, CreditCard, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

export const ManageSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    restaurantId: '',
    planId: '',
    status: 'active',
    nextBillingDate: '',
  });
  const isMobile = useIsMobile();

  const fetchData = async () => {
    try {
      const [subsData, restsData, plansData] = await Promise.all([
        superAdminApi.getSubscriptions(),
        superAdminApi.getRestaurants(),
        superAdminApi.getPlans(),
      ]);
      setSubscriptions(subsData);
      setRestaurants(restsData);
      setPlans(plansData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminApi.createSubscription({
        restaurantId: formData.restaurantId,
        planId: formData.planId,
        status: formData.status,
        nextBillingDate: formData.nextBillingDate || undefined,
      });
      toast({
        title: 'Success',
        description: 'Subscription created successfully',
      });
      setIsDialogOpen(false);
      setFormData({
        restaurantId: '',
        planId: '',
        status: 'active',
        nextBillingDate: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create subscription',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Subscriptions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage subscriptions
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create New Subscription</DialogTitle>
                  <DialogDescription>
                    Assign a plan to a restaurant
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant">Restaurant</Label>
                    <Select
                      value={formData.restaurantId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, restaurantId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Select
                      value={formData.planId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, planId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ₹{plan.price}
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextBillingDate">Next Billing Date (Optional)</Label>
                    <Input
                      id="nextBillingDate"
                      type="date"
                      value={formData.nextBillingDate}
                      onChange={(e) =>
                        setFormData({ ...formData, nextBillingDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Subscription</Button>
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
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))
          ) : subscriptions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No subscriptions found. Create your first subscription to get started.
              </CardContent>
            </Card>
          ) : (
            subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {subscription.restaurant?.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plan?.name || 'Unknown'}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(subscription.status)} className="ml-2">
                      {subscription.status}
                    </Badge>
                  </div>
                  {subscription.nextBillingDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      Next: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(subscription.createdAt).toLocaleDateString()}
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
            <CreditCard className="w-8 h-8" />
            Subscriptions
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage restaurant subscriptions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Subscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Subscription</DialogTitle>
                <DialogDescription>
                  Assign a plan to a restaurant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant">Restaurant</Label>
                  <Select
                    value={formData.restaurantId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, restaurantId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={formData.planId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, planId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ₹{plan.price}
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextBillingDate">Next Billing Date (Optional)</Label>
                  <Input
                    id="nextBillingDate"
                    type="date"
                    value={formData.nextBillingDate}
                    onChange={(e) =>
                      setFormData({ ...formData, nextBillingDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Subscription</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No subscriptions found. Create your first subscription to get started.
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">
                    {subscription.restaurant?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>{subscription.plan?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {subscription.nextBillingDate ? (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(subscription.createdAt).toLocaleDateString()}
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
