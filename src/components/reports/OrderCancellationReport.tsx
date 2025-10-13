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

const formatDate = (date: string) => new Date(date).toLocaleString();

const OrderCancellationReport = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
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
    try {
      const response = await apiService.getReport("order-cancellation", params);
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
      <Button onClick={handleGenerateReport} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Report"}
      </Button>
    </>
  );

  return (
    <ReportLayout
      title="Order Cancellation Report"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Cancelled Orders ({reportData?.cancelledOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Cancelled By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.cancelledOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id}
                    </TableCell>
                    <TableCell>{order.user?.name || "N/A"}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Cancelled Items ({reportData?.cancelledItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Cancelled By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.cancelledItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.menuItem.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.orderId}
                    </TableCell>
                    <TableCell>{item.order.user?.name || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ReportLayout>
  );
};

export default OrderCancellationReport;
