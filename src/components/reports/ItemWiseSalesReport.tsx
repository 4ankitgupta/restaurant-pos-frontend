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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const ItemWiseSalesReport = () => {
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
      const response = await apiService.getReport("item-wise-sales", params);
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

  const chartData = reportData?.itemSales
    .slice(0, 10)
    .map((item: any) => ({
      name: item.itemName.length > 15 ? item.itemName.substring(0, 15) + '...' : item.itemName,
      quantity: item.quantitySold,
      revenue: item.totalValue,
    })) || [];

  return (
    <ReportLayout
      title="Item-wise Sales Report"
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
          {/* Top Selling Items Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === "revenue") return [formatCurrency(value), "Revenue"];
                      return [value, "Quantity"];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" name="Quantity" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="revenue" fill="hsl(var(--secondary))" name="Revenue" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Items - Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.itemSales.map((item: any, index: number) => (
                      <TableRow key={item.itemName} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-md bg-secondary/20 text-xs">
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantitySold}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(item.totalValue)}
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

export default ItemWiseSalesReport;
