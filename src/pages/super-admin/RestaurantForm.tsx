import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  superAdminApi,
  Restaurant,
  SuperAdminApiError,
} from "@/services/superAdminApiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Schema for validation
const createSchema = z
  .object({
    name: z.string().min(1, "Restaurant name is required"),
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    adminName: z.string().min(1, "Admin name is required"),
    adminEmail: z.string().email("Admin email is required"),
    adminPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const editSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;
type FormData = CreateFormData | EditFormData;

interface RestaurantFormProps {
  initialData: Restaurant | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RestaurantForm: React.FC<RestaurantFormProps> = ({
  initialData,
  onClose,
  onSuccess,
}) => {
  const isEditMode = !!initialData;
  const validationSchema = isEditMode ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...initialData,
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      address: initialData?.address ?? "",
      ...(isEditMode
        ? {}
        : {
            adminName: "",
            adminEmail: "",
            adminPassword: "",
            confirmPassword: "",
          }),
    },
  });

  useEffect(() => {
    reset({
      ...initialData,
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      address: initialData?.address ?? "",
      ...(isEditMode
        ? {}
        : {
            adminName: "",
            adminEmail: "",
            adminPassword: "",
            confirmPassword: "",
          }),
    });
  }, [initialData, reset, isEditMode]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode) {
        // Edit Mode - data is EditFormData
        const editData: EditFormData = {
          name: data.name!,
          email: data.email || "",
          phone: data.phone,
          address: data.address,
        };
        await superAdminApi.updateRestaurant(initialData!.id, editData);
        toast({
          title: "Success",
          description: "Restaurant updated successfully",
        });
      } else {
        // Create Mode - data is CreateFormData
        const createData = data as CreateFormData;
        // Type assertion is safe here because zod validates all required fields
        await superAdminApi.createRestaurant({
          name: createData.name!,
          email: createData.email || "",
          phone: createData.phone,
          address: createData.address,
          adminName: createData.adminName!,
          adminEmail: createData.adminEmail!,
          adminPassword: createData.adminPassword!,
        });
        toast({
          title: "Success",
          description: "Restaurant and admin user created successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          (error as SuperAdminApiError).message || "Operation failed",
        variant: "destructive",
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Restaurant" : "Create New Restaurant"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the restaurant details."
              : "Add a new restaurant and its first admin user."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <h4 className="text-sm font-medium">Restaurant Details</h4>
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., The Grand Cafe"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Restaurant Email (Optional)</Label>
            <Input
              id="email"
              {...register("email")}
              placeholder="info@grandcafe.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Restaurant Phone (Optional)</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+91 12345 67890"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Restaurant Address (Optional)</Label>
            <Textarea
              id="address"
              {...register("address")}
              placeholder="123 Main St, City, Country"
              rows={3}
            />
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address.message}</p>
            )}
          </div>

          {!isEditMode && (
            <>
              <Separator className="my-4" />
              <h4 className="text-sm font-medium">Admin User Details</h4>
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name</Label>
                <Input
                  id="adminName"
                  {...register("adminName")}
                  placeholder="John Doe"
                />
                {!isEditMode && "adminName" in errors && (
                  <p className="text-red-500 text-sm">
                    {errors.adminName?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  {...register("adminEmail")}
                  placeholder="admin@grandcafe.com"
                />
                {!isEditMode && "adminEmail" in errors && (
                  <p className="text-red-500 text-sm">
                    {errors.adminEmail?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  {...register("adminPassword")}
                />
                {!isEditMode && "adminPassword" in errors && (
                  <p className="text-red-500 text-sm">
                    {errors.adminPassword?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {!isEditMode && "confirmPassword" in errors && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword?.message}
                  </p>
                )}
              </div>
            </>
          )}
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
              ? "Save Changes"
              : "Create Restaurant"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};
