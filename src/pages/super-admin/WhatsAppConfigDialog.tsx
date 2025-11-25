import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { superAdminApi } from "@/services/superAdminApiService";

interface WhatsAppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  restaurantName: string;
}

interface WhatsAppConfig {
  whatsappEnabled: boolean;
  whatsappProvider: "PLATFORM" | "CUSTOM";
  messageCredits: number;
}

export const WhatsAppConfigDialog: React.FC<WhatsAppConfigDialogProps> = ({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Current Configuration
  const [config, setConfig] = useState<WhatsAppConfig>({
    whatsappEnabled: true,
    whatsappProvider: "PLATFORM",
    messageCredits: 100,
  });

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [provider, setProvider] = useState<"PLATFORM" | "CUSTOM">("PLATFORM");
  const [creditsToAdd, setCreditsToAdd] = useState<string>("");

  // Custom Provider Fields
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromNumber, setFromNumber] = useState("");

  // Fetch current configuration
  useEffect(() => {
    if (open && restaurantId) {
      fetchConfig();
    }
  }, [open, restaurantId]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getWhatsAppConfig(restaurantId);
      setConfig(data);
      setEnabled(data.whatsappEnabled);
      setProvider(data.whatsappProvider);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        whatsappEnabled: enabled,
        whatsappProvider: provider,
      };

      // Add credits if specified
      if (creditsToAdd && Number(creditsToAdd) > 0) {
        payload.addCredits = Number(creditsToAdd);
      }

      // Include custom config if CUSTOM provider
      if (provider === "CUSTOM" && accountSid && authToken && fromNumber) {
        payload.customConfig = {
          accountSid,
          authToken,
          fromNumber,
        };
      }

      await superAdminApi.updateWhatsAppConfig(restaurantId, payload);

      toast({
        title: "✅ Configuration Saved",
        description: "WhatsApp settings updated successfully",
      });

      // Refresh config
      await fetchConfig();

      // Reset form fields
      setCreditsToAdd("");
      setAccountSid("");
      setAuthToken("");
      setFromNumber("");

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRechargeCredits = async () => {
    if (!creditsToAdd || Number(creditsToAdd) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid credit amount",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await superAdminApi.updateWhatsAppConfig(restaurantId, {
        addCredits: Number(creditsToAdd),
      });

      toast({
        title: "✅ Credits Recharged",
        description: `Added ${creditsToAdd} credits successfully`,
      });

      await fetchConfig();
      setCreditsToAdd("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to recharge credits",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Configuration - {restaurantName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Current Credits Badge */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Message Credits
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {config.messageCredits}
                  </p>
                </div>
                <CreditCard className="w-12 h-12 text-blue-300" />
              </div>
            </div>

            {/* Enable WhatsApp Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-semibold">
                  Enable WhatsApp Bill Sharing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow cashiers to send bills via WhatsApp
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider">WhatsApp Provider</Label>
              <Select
                value={provider}
                onValueChange={(value) =>
                  setProvider(value as "PLATFORM" | "CUSTOM")
                }
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLATFORM">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Recommended</Badge>
                      Platform (Rasoi Track)
                    </div>
                  </SelectItem>
                  <SelectItem value="CUSTOM">
                    Restaurant's Own Twilio Account
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {provider === "PLATFORM"
                  ? "Uses Rasoi Track's centralized Twilio account with credit system"
                  : "Restaurant will use their own Twilio account credentials"}
              </p>
            </div>

            {/* Credit Recharge (Only for PLATFORM) */}
            {provider === "PLATFORM" && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                <Label htmlFor="credits" className="font-semibold">
                  Recharge Credits
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    placeholder="Enter credits to add"
                    value={creditsToAdd}
                    onChange={(e) => setCreditsToAdd(e.target.value)}
                  />
                  <Button
                    onClick={handleRechargeCredits}
                    disabled={
                      saving || !creditsToAdd || Number(creditsToAdd) <= 0
                    }
                    variant="secondary"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Add Credits
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Each WhatsApp message costs 1 credit
                </p>
              </div>
            )}

            {/* Custom Twilio Configuration */}
            {provider === "CUSTOM" && (
              <div className="space-y-4 p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  🔐 Custom Twilio Configuration
                </p>

                <div className="space-y-2">
                  <Label htmlFor="accountSid">Account SID *</Label>
                  <Input
                    id="accountSid"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authToken">Auth Token *</Label>
                  <Input
                    id="authToken"
                    type="password"
                    placeholder="Your Twilio Auth Token"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token will be encrypted before storage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromNumber">From Number *</Label>
                  <Input
                    id="fromNumber"
                    placeholder="whatsapp:+14155238886"
                    value={fromNumber}
                    onChange={(e) => setFromNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: whatsapp:+[country code][number]
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
