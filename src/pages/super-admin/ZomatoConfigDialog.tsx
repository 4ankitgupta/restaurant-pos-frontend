import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import { superAdminApi, Restaurant } from "@/services/superAdminApiService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ZomatoConfigDialogProps {
  restaurant: Restaurant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ZomatoConfigDialog: React.FC<ZomatoConfigDialogProps> = ({
  restaurant,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [formData, setFormData] = useState({
    enabled: false,
    zomatoApiKey: "",
    zomatoRestaurantId: "",
    webhookSecret: "",
  });

  const [existingConfig, setExistingConfig] = useState<any>(null);

  useEffect(() => {
    if (open && restaurant) {
      fetchExistingConfig();
    } else {
      // Reset form when dialog closes
      setFormData({
        enabled: false,
        zomatoApiKey: "",
        zomatoRestaurantId: "",
        webhookSecret: "",
      });
      setExistingConfig(null);
    }
  }, [open, restaurant]);

  const fetchExistingConfig = async () => {
    if (!restaurant) return;

    setIsFetching(true);
    try {
      const config = await superAdminApi.getZomatoConfig(restaurant.id);
      setExistingConfig(config);
      setFormData({
        enabled: config.zomatoIntegrationEnabled || false,
        zomatoApiKey: "", // Don't show encrypted keys
        zomatoRestaurantId: config.zomatoIntegration?.zomatoRestaurantId || "",
        webhookSecret: "", // Don't show encrypted secrets
      });
    } catch (error: any) {
      // If no config exists, that's okay
      if (error?.code !== 404) {
        toast({
          title: "Error",
          description: "Failed to fetch Zomato configuration",
          variant: "destructive",
        });
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurant) return;

    // Validation
    if (!formData.zomatoApiKey.trim() || !formData.zomatoRestaurantId.trim()) {
      toast({
        title: "Validation Error",
        description: "Zomato API Key and Restaurant ID are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await superAdminApi.updateZomatoConfig(restaurant.id, {
        zomatoApiKey: formData.zomatoApiKey,
        zomatoRestaurantId: formData.zomatoRestaurantId,
        webhookSecret: formData.webhookSecret || undefined,
        enabled: formData.enabled,
      });

      toast({
        title: "Success",
        description: "Zomato integration configured successfully",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save Zomato configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!restaurant) return;

    if (
      !confirm(
        "Are you sure you want to delete the Zomato integration configuration?"
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await superAdminApi.deleteZomatoConfig(restaurant.id);

      toast({
        title: "Success",
        description: "Zomato integration disabled and configuration removed",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete Zomato configuration",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zomato Integration Settings</DialogTitle>
          <DialogDescription>
            Configure Zomato Partner API integration for {restaurant?.name}
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Enable/Disable Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integration Status</CardTitle>
                <CardDescription>
                  Enable or disable Zomato order integration for this restaurant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled" className="cursor-pointer">
                    Enable Zomato Integration
                  </Label>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Existing Config Info */}
            {existingConfig?.zomatoIntegration && (
              <Alert>
                <AlertDescription>
                  <strong>Current Configuration:</strong>
                  <br />
                  Restaurant ID:{" "}
                  {existingConfig.zomatoIntegration.zomatoRestaurantId}
                  <br />
                  Configured:{" "}
                  {new Date(
                    existingConfig.zomatoIntegration.createdAt
                  ).toLocaleDateString()}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Leave fields empty to keep existing encrypted credentials
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* API Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Credentials</CardTitle>
                <CardDescription>
                  Enter your Zomato Partner API credentials. These will be
                  encrypted before storage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Zomato API Key */}
                <div className="space-y-2">
                  <Label htmlFor="zomatoApiKey">
                    Zomato API Key <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="zomatoApiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder={
                        existingConfig?.zomatoIntegration
                          ? "••••••••••••"
                          : "Enter Zomato API Key"
                      }
                      value={formData.zomatoApiKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          zomatoApiKey: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Zomato Restaurant ID */}
                <div className="space-y-2">
                  <Label htmlFor="zomatoRestaurantId">
                    Zomato Restaurant ID{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="zomatoRestaurantId"
                    type="text"
                    placeholder="Enter Zomato Restaurant ID"
                    value={formData.zomatoRestaurantId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        zomatoRestaurantId: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    The unique identifier for this restaurant in Zomato's system
                  </p>
                </div>

                {/* Webhook Secret (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">
                    Webhook Secret{" "}
                    <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="webhookSecret"
                      type={showWebhookSecret ? "text" : "password"}
                      placeholder={
                        existingConfig?.zomatoIntegration
                          ? "••••••••••••"
                          : "Enter Webhook Secret"
                      }
                      value={formData.webhookSecret}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          webhookSecret: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    >
                      {showWebhookSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Secret key for verifying webhook signatures from Zomato
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Webhook URL Info */}
            <Alert>
              <AlertDescription>
                <strong>Webhook URL:</strong>
                <br />
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {window.location.origin}/api/v1/public/zomato/webhook?resId=
                  {restaurant?.id}
                </code>
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  Configure this URL in your Zomato Partner dashboard to receive
                  order events
                </span>
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2">
              {existingConfig?.zomatoIntegration && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isLoading}
                  className="mr-auto"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Config
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isDeleting}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Configuration"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
