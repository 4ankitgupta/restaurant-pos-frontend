import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportLayout } from "./ReportLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Clock, TrendingUp } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const SalesByHourReport = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
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
    if (dayOfWeek && dayOfWeek !== "ALL") params.dayOfWeek = dayOfWeek;

    try {
      const response = await apiService.getReport("sales-by-hour", params);
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
      <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Day of Week" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Days</SelectItem>
          <SelectItem value="0">Sunday</SelectItem>
          <SelectItem value="1">Monday</SelectItem>
          <SelectItem value="2">Tuesday</SelectItem>
          <SelectItem value="3">Wednesday</SelectItem>
          <SelectItem value="4">Thursday</SelectItem>
          <SelectItem value="5">Friday</SelectItem>
          <SelectItem value="6">Saturday</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleGenerateReport} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Report"}
      </Button>
    </>
  );

  return (
    <ReportLayout
      title="Sales by Hour / Heatmap Report"
      subtitle="Optimize staffing and kitchen prep based on peak business times"
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
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Peak Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {reportData.summary.peakHour}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(reportData.summary.peakHourSales)} in sales
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Active Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reportData.summary.totalHoursWithSales}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Hours with sales activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.salesByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hourLabel"
                      label={{
                        value: "Hour of Day",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: "Sales Value (₹)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: "Orders",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        if (
                          name === "totalSalesValue" ||
                          name === "averageOrderValue"
                        ) {
                          return formatCurrency(value);
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="totalSalesValue"
                      fill="#3b82f6"
                      name="Sales Value"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="totalOrders"
                      fill="#f59e0b"
                      name="Orders"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Hour</th>
                      <th className="text-right p-2">Orders</th>
                      <th className="text-right p-2">Sales Value</th>
                      <th className="text-right p-2">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salesByHour.map((hour: any) => (
                      <tr
                        key={hour.hour}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-2 font-medium">{hour.hourLabel}</td>
                        <td className="text-right p-2">{hour.totalOrders}</td>
                        <td className="text-right p-2 font-semibold">
                          {formatCurrency(hour.totalSalesValue)}
                        </td>
                        <td className="text-right p-2">
                          {formatCurrency(hour.averageOrderValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Insight Card */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <p className="text-sm text-purple-800">
                <strong>💡 Tip:</strong> Use this data to optimize staff
                scheduling, plan inventory prep times, and identify
                opportunities for happy hour promotions during slower periods.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default SalesByHourReport;
