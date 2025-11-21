import React, { useEffect, useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { superAdminApi, Restaurant } from "@/services/superAdminApiService";
import { Separator } from "@/components/ui/separator";

interface FeatureFlagsDialogProps {
  restaurant: Restaurant;
  onClose: () => void;
  onSuccess: () => void;
}

// Define available features
const AVAILABLE_FEATURES = [
  {
    key: "ai_chat",
    name: "AI Chat Assistant",
    description:
      "Enable AI-powered chat assistant for restaurant analytics and support",
  },
  {
    key: "inventory_management",
    name: "Inventory Management",
    description: "Complete inventory tracking, stock logs, and purchase orders",
  },
  {
    key: "reports",
    name: "Reports & Analytics",
    description:
      "Access to sales reports, inventory reports, and business analytics",
  },
  {
    key: "attendance",
    name: "Employee Attendance",
    description: "Biometric attendance tracking and employee management",
  },
  {
    key: "advanced_ordering",
    name: "Advanced Ordering",
    description: "Table management, order notes, and item variants",
  },
];

export const FeatureFlagsDialog: React.FC<FeatureFlagsDialogProps> = ({
  restaurant,
  onClose,
  onSuccess,
}) => {
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize feature flags from restaurant data
    const flags = (restaurant.featureFlags as Record<string, boolean>) || {};
    setFeatureFlags(flags);
  }, [restaurant]);

  const handleToggleFeature = (featureKey: string) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [featureKey]: !prev[featureKey],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await superAdminApi.updateRestaurant(restaurant.id, {
        featureFlags,
      });
      toast({
        title: "Success",
        description: "Feature flags updated successfully",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update feature flags",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Manage Features - {restaurant.name}</DialogTitle>
        <DialogDescription>
          Enable or disable features for this restaurant
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
        {AVAILABLE_FEATURES.map((feature) => (
          <div key={feature.key}>
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-1">
                <Label htmlFor={feature.key} className="text-base font-medium">
                  {feature.name}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              <Switch
                id={feature.key}
                checked={featureFlags[feature.key] === true}
                onCheckedChange={() => handleToggleFeature(feature.key)}
              />
            </div>
            <Separator className="mt-4" />
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
