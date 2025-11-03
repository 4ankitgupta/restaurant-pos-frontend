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
import { format } from "date-fns";

const punchFormSchema = z.object({
  employeeCode: z.string().min(1, "Please select an employee"),
});

type PunchFormData = z.infer<typeof punchFormSchema>;

interface ManualPunchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ManualPunchDialog({
  open,
  onOpenChange,
  onSuccess,
}: ManualPunchDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { loading: employeesLoading, execute: executeGetEmployees } =
    useApi<{ data: Employee[] }>();
  const { loading: submitLoading, execute: executeSubmit } = useApi<{
    data: { employeeName: string; punchType: string; timestamp: string };
  }>();

  const form = useForm<PunchFormData>({
    resolver: zodResolver(punchFormSchema),
    defaultValues: {
      employeeCode: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
      form.reset({ employeeCode: "" });
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      const response = await executeGetEmployees(() =>
        apiService.getEmployees()
      );
      if (response) {
        // Filter only active employees
        setEmployees(response.data.filter((emp) => emp.isActive));
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const onSubmit = async (data: PunchFormData) => {
    try {
      const response = await executeSubmit(() =>
        apiService.recordAttendancePunch({
          employeeCode: data.employeeCode,
          source: "Manual_Admin",
        })
      );

      if (response) {
        const { employeeName, punchType, timestamp } = response.data;
        const time = format(new Date(timestamp), "hh:mm a");

        toast({
          title: "Success",
          description: `Successfully punched ${punchType} ${employeeName} at ${time}`,
        });

        onSuccess();
        onOpenChange(false);
        form.reset();
      }
    } catch (error) {
      console.error("Failed to record punch:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Manual Attendance Punch</DialogTitle>
          <DialogDescription>
            Record a manual punch for an employee. The system will automatically
            determine if it's an IN or OUT punch.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Employee</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={employeesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem
                          key={employee.id}
                          value={employee.employeeCode}
                        >
                          {employee.name} ({employee.employeeCode})
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
                {submitLoading ? "Recording..." : "Record Punch"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
