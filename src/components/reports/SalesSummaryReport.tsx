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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(reportData.summary.totalSales)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {reportData.summary.orderCount} orders
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(reportData.summary.totalSales / reportData.summary.orderCount || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Per transaction
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">
                          {order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={order.takeAway ? "secondary" : "outline"}>
                            {order.takeAway ? "Takeaway" : "Dine-In"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default SalesSummaryReport;
