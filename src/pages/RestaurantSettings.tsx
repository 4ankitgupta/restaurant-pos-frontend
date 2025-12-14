import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { restaurantApi } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Building2, Loader2, X } from "lucide-react";
import { API_BASE_URL } from "@/config/apiConfig";

const schema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RestaurantData extends FormData {
  id: string;
  logoUrl?: string | null;
  upiQrCodeUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const RestaurantSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(
    null
  );
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedQrCode, setSelectedQrCode] = useState<File | null>(null);
  const [deleteLogo, setDeleteLogo] = useState(false);
  const [deleteQrCode, setDeleteQrCode] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const baseUrl = API_BASE_URL.replace(/\/api\/v1$/, "");

  const fetchRestaurantData = async () => {
    try {
      setIsLoading(true);
      const data = await restaurantApi.getRestaurantInfo();
      setRestaurantData(data);
      reset({
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        phone2: data.phone2 || "",
        gstin: data.gstin || "",
        address: data.address || "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch restaurant details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSaving(true);
      await restaurantApi.updateRestaurantInfo({
        ...data,
        logo: selectedLogo || undefined,
        upiQrCode: selectedQrCode || undefined,
        deleteLogo,
        deleteQrCode,
      });

      toast({
        title: "Success",
        description: "Restaurant details updated successfully",
      });

      // Refresh data
      await fetchRestaurantData();
      setSelectedLogo(null);
      setSelectedQrCode(null);
      setDeleteLogo(false);
      setDeleteQrCode(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update restaurant details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Restaurant Settings</h1>
          <p className="text-muted-foreground">
            Manage your restaurant information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>
            Update your restaurant details, logo, and payment QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Details</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter restaurant name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="restaurant@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+91 12345 67890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone2">Alternate Phone</Label>
                  <Input
                    id="phone2"
                    {...register("phone2")}
                    placeholder="Secondary contact"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    {...register("gstin")}
                    placeholder="GST Number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  {...register("address")}
                  placeholder="123 Main St, City, Country"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Logo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Restaurant Logo</h3>

              {restaurantData?.logoUrl && !deleteLogo && !selectedLogo && (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <img
                    src={`${baseUrl}${restaurantData.logoUrl}`}
                    alt="Current Logo"
                    className="w-20 h-20 object-contain border rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Logo</p>
                    <p className="text-xs text-muted-foreground">
                      {restaurantData.logoUrl}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteLogo(true)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}

              {deleteLogo && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    Logo will be removed on save
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setDeleteLogo(false)}
                  >
                    Undo
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="logo">Upload New Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedLogo(e.target.files[0]);
                      setDeleteLogo(false);
                    }
                  }}
                />
                {selectedLogo && (
                  <p className="text-sm text-green-600">
                    Selected: {selectedLogo.name}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* QR Code Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">UPI Payment QR Code</h3>

              {restaurantData?.upiQrCodeUrl &&
                !deleteQrCode &&
                !selectedQrCode && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={`${baseUrl}${restaurantData.upiQrCodeUrl}`}
                      alt="Current QR Code"
                      className="w-20 h-20 object-contain border rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Current QR Code</p>
                      <p className="text-xs text-muted-foreground">
                        {restaurantData.upiQrCodeUrl}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteQrCode(true)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}

              {deleteQrCode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    QR Code will be removed on save
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setDeleteQrCode(false)}
                  >
                    Undo
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="upiQrCode">Upload New QR Code</Label>
                <Input
                  id="upiQrCode"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedQrCode(e.target.files[0]);
                      setDeleteQrCode(false);
                    }
                  }}
                />
                {selectedQrCode && (
                  <p className="text-sm text-green-600">
                    Selected: {selectedQrCode.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This QR code will be displayed on printed bills for customers
                  to make UPI payments
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  fetchRestaurantData();
                  setSelectedLogo(null);
                  setSelectedQrCode(null);
                  setDeleteLogo(false);
                  setDeleteQrCode(false);
                }}
                disabled={isSaving}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
