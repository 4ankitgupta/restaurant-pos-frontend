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
import { ReportLayout } from "./ReportLayout";
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
const formatDate = (date: string) => new Date(date).toLocaleString();

const SalesSummaryReport = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [orderType, setOrderType] = useState("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setError(null);
    setIsLoading(true);
    setReportData(null);

    const params: Record<string, string> = {};
    if (orderType && orderType !== "ALL") params.orderType = orderType;
    if (dateRange?.from)
      params.startDate = format(dateRange.from, "yyyy-MM-dd");
    if (dateRange?.to) params.endDate = format(dateRange.to, "yyyy-MM-dd");

    if (isLoading) {
      return <div>Loading report...</div>;
    }

    if (error) {
      return <div className="text-red-500">Error: {error}</div>;
    }

    if (!reportData) {
      return (
        <div className="text-center">
          Please select a date range and generate a report.
        </div>
      );
    }

    try {
      const response = await apiService.getReport("sales-summary", params);
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
      <Select value={orderType} onValueChange={setOrderType}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Order Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Types</SelectItem>
          <SelectItem value="DINE_IN">Dine-In</SelectItem>
          <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleGenerateReport} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Report"}
      </Button>
    </>
  );

  return (
    <ReportLayout
      title="Sales Summary Report"
      subtitle={
        reportData
          ? `Report for ${formatDate(
              reportData.reportMeta.startDate
            )} to ${formatDate(reportData.reportMeta.endDate)}`
          : "No date range selected"
      }
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Sales</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {formatCurrency(reportData.summary.totalSales)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Orders</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {reportData.summary.orderCount}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id}
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        {order.takeAway ? "Takeaway" : "Dine-In"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default SalesSummaryReport;
