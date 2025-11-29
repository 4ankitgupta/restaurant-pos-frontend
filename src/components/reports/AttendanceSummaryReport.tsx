import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportLayout } from "./ReportLayout";
import { Users, Clock, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttendanceReportTable } from "@/components/attendance/AttendanceReportTable";
import { AttendanceReport } from "@/types/employee";

const AttendanceSummaryReport = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [employees, setEmployees] = useState<any[]>([]);
  const [reportData, setReportData] = useState<AttendanceReport[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await apiService.getEmployees();
        setEmployees(response.data || []);
      } catch (err: any) {
        console.error("Failed to fetch employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleGenerateReport = async () => {
    setError(null);
    setIsLoading(true);
    setReportData(null);

    try {
      const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
      const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : undefined;

      const response = await apiService.getAttendanceReport(startDate, endDate);
      let data = response.data || [];

      // Filter by selected employee if not "ALL"
      if (selectedEmployeeId !== "ALL") {
        data = data.filter(
          (record: AttendanceReport) => record.employeeId === selectedEmployeeId
        );
      }

      setReportData(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate attendance report.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary metrics
  const calculateSummary = () => {
    if (!reportData || reportData.length === 0) {
      return {
        totalStaffPresent: 0,
        totalHoursWorked: 0,
        averageHoursPerDay: 0,
      };
    }

    const totalStaffPresent = reportData.length;

    // Calculate total hours worked (sum of all employee hours)
    const totalHoursWorked = reportData.reduce((sum, employee) => {
      // Parse hours from format like "8.5 hrs" or "8 hrs"
      const hoursMatch = employee.totalHoursWorked.match(/[\d.]+/);
      const hours = hoursMatch ? parseFloat(hoursMatch[0]) : 0;
      return sum + hours;
    }, 0);

    // Calculate average hours per day
    // If date range is provided, calculate days, otherwise assume 1 day
    let numberOfDays = 1;
    if (dateRange?.from && dateRange?.to) {
      const diffTime = Math.abs(
        dateRange.to.getTime() - dateRange.from.getTime()
      );
      numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const averageHoursPerDay =
      totalStaffPresent > 0
        ? totalHoursWorked / (totalStaffPresent * numberOfDays)
        : 0;

    return {
      totalStaffPresent,
      totalHoursWorked: totalHoursWorked.toFixed(1),
      averageHoursPerDay: averageHoursPerDay.toFixed(1),
    };
  };

  const summary = calculateSummary();

  const filters = (
    <>
      <DateRangePicker onDateChange={setDateRange} />
      <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
        <SelectTrigger className="w-full md:w-[220px]">
          <SelectValue placeholder="Select Employee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Employees</SelectItem>
          {employees.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              {emp.name} ({emp.employeeCode})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleGenerateReport} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Report"}
      </Button>
    </>
  );

  return (
    <ReportLayout
      title="Attendance Log / Staff Attendance Report"
      subtitle="Track employee attendance, working hours, and punctuality"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      {!reportData ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Please select a date range and click "Generate Report" to view
            attendance data.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Total Staff Present
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {summary.totalStaffPresent}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Employees recorded
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  Total Hours Worked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {summary.totalHoursWorked}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Hours in selected period
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Average Hours/Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {summary.averageHoursPerDay}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Per employee per day
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <AttendanceReportTable data={reportData} loading={false} />

          {/* Insights Card */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-amber-800">
                  <strong>💡 Use this report to:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                  <li>Monitor employee punctuality and attendance patterns</li>
                  <li>Calculate accurate payroll based on hours worked</li>
                  <li>
                    Identify staffing gaps and schedule optimization
                    opportunities
                  </li>
                  <li>
                    Track overtime and ensure compliance with labor regulations
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default AttendanceSummaryReport;
