import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  UserCheck,
  Mail,
  Briefcase,
  CreditCard,
  Link as LinkIcon,
} from "lucide-react";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { EmployeeForm } from "@/components/employee/EmployeeForm";
import { useRefresh } from "@/contexts/RefreshContext";
import { Employee } from "@/types/employee";

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [filterActive, setFilterActive] = useState<string>("all");

  const { loading: employeesLoading, execute: executeGetEmployees } =
    useApi<{ data: Employee[] }>();
  const { loading: deleteLoading, execute: executeDelete } = useApi();
  const { refreshKey } = useRefresh();

  useEffect(() => {
    fetchEmployees();
  }, [refreshKey]);

  const fetchEmployees = async () => {
    try {
      const response = await executeGetEmployees(() =>
        apiService.getEmployees()
      );
      if (response) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await executeDelete(() => apiService.deleteEmployee(employeeId));
      toast({ title: "Success", description: "Employee deleted successfully" });
      fetchEmployees();
    } catch (error) {
      console.error("Failed to delete employee:", error);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      await apiService.updateEmployee(employee.id, {
        isActive: !employee.isActive,
      });
      toast({
        title: "Success",
        description: `Employee ${employee.isActive ? "deactivated" : "activated"} successfully`,
      });
      fetchEmployees();
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast({
        title: "Error",
        description: "Failed to update employee status",
        variant: "destructive",
      });
    }
  };

  const startEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEmployeeFormOpen(true);
  };

  const filteredEmployees =
    filterActive === "all"
      ? employees
      : employees.filter((emp) =>
          filterActive === "active" ? emp.isActive : !emp.isActive
        );

  const loading = employeesLoading || deleteLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <Button onClick={() => setIsEmployeeFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
        <EmployeeForm
          open={isEmployeeFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingEmployee(null);
            }
            setIsEmployeeFormOpen(open);
          }}
          onSuccess={fetchEmployees}
          editingEmployee={editingEmployee}
        />
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterActive === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive("all")}
            >
              All Employees ({employees.length})
            </Button>
            <Button
              variant={filterActive === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive("active")}
            >
              Active ({employees.filter((e) => e.isActive).length})
            </Button>
            <Button
              variant={filterActive === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive("inactive")}
            >
              Inactive ({employees.filter((e) => !e.isActive).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <Badge variant={employee.isActive ? "default" : "secondary"}>
                      {employee.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditEmployee(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{employee.name}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Code: {employee.employeeCode}
                </div>
                {employee.designation && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {employee.designation}
                  </div>
                )}
                {employee.user ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Linked: {employee.user.email}
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    No linked user
                  </div>
                )}
                {employee.biometricId && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Bio ID: {employee.biometricId}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleToggleActive(employee)}
                >
                  {employee.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Employees Found</h3>
            <p className="text-muted-foreground">
              {filterActive === "all"
                ? "No employees found. Add some employees to get started."
                : "No employees with this status. Try selecting a different filter."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Employees;
