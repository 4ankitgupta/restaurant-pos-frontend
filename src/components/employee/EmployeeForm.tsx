import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { Employee } from "@/types/employee";

const employeeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employeeCode: z.string().min(1, "Employee code is required"),
  biometricId: z.string().optional(),
  userId: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingEmployee?: Employee | null;
}

export function EmployeeForm({
  open,
  onOpenChange,
  onSuccess,
  editingEmployee,
}: EmployeeFormProps) {
  const [users, setUsers] = useState<any[]>([]);
  const { loading: usersLoading, execute: executeGetUsers } = useApi<any[]>();
  const { loading: submitLoading, execute: executeSubmit } = useApi();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      employeeCode: "",
      biometricId: "",
      userId: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchUsers();
      if (editingEmployee) {
        form.reset({
          name: editingEmployee.name,
          employeeCode: editingEmployee.employeeCode,
          biometricId: editingEmployee.biometricId || "",
          userId: editingEmployee.userId || "",
        });
      } else {
        form.reset({
          name: "",
          employeeCode: "",
          biometricId: "",
          userId: "",
        });
      }
    }
  }, [open, editingEmployee]);

  const fetchUsers = async () => {
    try {
      const response = await executeGetUsers(() => apiService.getUsers());
      if (response) {
        setUsers(response);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (editingEmployee) {
        // For update, all fields are optional
        const updatePayload = {
          ...data,
          userId: data.userId || undefined,
        };
        await executeSubmit(() =>
          apiService.updateEmployee(editingEmployee.id, updatePayload)
        );
        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        // For create, name and employeeCode are required
        const createPayload = {
          name: data.name,
          employeeCode: data.employeeCode,
          biometricId: data.biometricId || undefined,
          userId: data.userId || undefined,
        };
        await executeSubmit(() => apiService.createEmployee(createPayload));
        toast({
          title: "Success",
          description: "Employee created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to submit employee:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingEmployee ? "Edit Employee" : "Create Employee"}
          </DialogTitle>
          <DialogDescription>
            {editingEmployee
              ? "Update employee information"
              : "Add a new employee to the system"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter employee name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter employee code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="biometricId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biometric ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter biometric ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to User (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={usersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user to link" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading
                  ? "Saving..."
                  : editingEmployee
                  ? "Update"
                  : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
