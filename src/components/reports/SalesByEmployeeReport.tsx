import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportLayout } from "./ReportLayout";
import { Users, Trophy, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const SalesByEmployeeReport = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [role, setRole] = useState<string>("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setError(null);
    setIsLoading(true);
    setReportData(null);

    const params: Record<string, string> = {};
    if (dateRange?.from)
      params.startDate = format(dateRange.from, "yyyy-MM-dd");
    if (dateRange?.to) params.endDate = format(dateRange.to, "yyyy-MM-dd");
    if (role && role !== "ALL") params.role = role;

    try {
      const response = await apiService.getReport("sales-by-employee", params);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setIsLoading(false);
    }
  };

  const filters = (
    <>
      <DateRangePicker onDateChange={setDateRange} />
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Roles</SelectItem>
          <SelectItem value="WAITER">Waiter</SelectItem>
          <SelectItem value="CASHIER">Cashier</SelectItem>
          <SelectItem value="MANAGER">Manager</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleGenerateReport} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Report"}
      </Button>
    </>
  );

  const getPerformanceBadge = (index: number, totalEmployees: number) => {
    const topThird = Math.ceil(totalEmployees / 3);
    if (index === 0) return <Badge className="bg-yellow-500">🏆 Top</Badge>;
    if (index < topThird)
      return <Badge className="bg-green-500">⭐ High</Badge>;
    return <Badge variant="secondary">Good</Badge>;
  };

  return (
    <ReportLayout
      title="Staff Performance / Sales by Employee Report"
      subtitle="Track individual sales team performance for incentives and training"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      {!reportData ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Please select a date range and click "Generate Report" to view data.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reportData.summary.totalEmployees}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Active during this period
                </p>
              </CardContent>
            </Card>

            {reportData.summary.topPerformer && (
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    Top Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700">
                    {reportData.summary.topPerformer.name}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(reportData.summary.topPerformer.sales)} in
                    sales
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Employee Performance (Sorted by Total Sales)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Employee Code</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Orders Taken</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">
                        Avg Order Value
                      </TableHead>
                      <TableHead className="text-right">
                        Discount Given
                      </TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.performanceData.map(
                      (emp: any, index: number) => (
                        <TableRow
                          key={emp.userId}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-bold text-lg">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {emp.employeeName}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {emp.employeeCode}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{emp.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {emp.totalOrdersTaken}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            {formatCurrency(emp.totalSalesValue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(emp.averageOrderValue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(emp.totalDiscountGiven)}
                          </TableCell>
                          <TableCell>
                            {getPerformanceBadge(
                              index,
                              reportData.performanceData.length
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Insights Card */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-purple-800">
                  <strong>💡 Use this report to:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-purple-800 space-y-1">
                  <li>Calculate performance-based incentives and bonuses</li>
                  <li>Identify top performers for recognition and rewards</li>
                  <li>
                    Monitor discount usage to prevent misuse or training needs
                  </li>
                  <li>Plan targeted training for underperforming staff</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Note about discount tracking */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Note:</strong> Discount tracking is not yet
                implemented. Add discount fields to the Order model to track
                promotional discounts and staff discount usage per employee.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default SalesByEmployeeReport;
