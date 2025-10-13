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

const StockConsumptionReport = () => {
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
      const response = await apiService.getReport("stock-consumption", params);
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
      title="Stock Consumption Report"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      <Card>
        <CardHeader>
          <CardTitle>Inventory Consumption</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Total Consumed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData?.consumptionData.map((item: any) => (
                <TableRow key={item.itemName}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell className="text-right">
                    {item.totalConsumed} {item.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ReportLayout>
  );
};

export default StockConsumptionReport;
