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
import { ExportButtons } from "./ExportButtons";
import { formatCurrency, formatNumber } from "@/lib/reportFormatting";
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
import { TrendingUp, ShoppingCart, Trophy } from "lucide-react";

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
      {reportData && (
        <ExportButtons
          data={reportData.itemSales}
          filename="item-wise-sales-report"
          reportTitle="Item-wise Sales Report"
        />
      )}
    </>
  );

  const chartData =
    reportData?.itemSales.slice(0, 10).map((item: any) => ({
      name:
        item.itemName.length > 15
          ? item.itemName.substring(0, 15) + "..."
          : item.itemName,
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-muted-foreground font-medium">
                    Total Items Sold
                  </CardTitle>
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatNumber(
                    reportData.itemSales.reduce(
                      (sum: number, item: any) => sum + item.quantitySold,
                      0
                    )
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Across {reportData.itemSales.length} menu items
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-muted-foreground font-medium">
                    Total Revenue
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(
                    reportData.itemSales.reduce(
                      (sum: number, item: any) => sum + item.totalValue,
                      0
                    )
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  From all items
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950 dark:to-yellow-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-muted-foreground font-medium">
                    Best Seller
                  </CardTitle>
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-yellow-600 truncate">
                  {reportData.itemSales[0]?.itemName || "N/A"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {reportData.itemSales[0]?.quantitySold || 0} units sold
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Items Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
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
                      if (name === "revenue")
                        return [formatCurrency(value), "Revenue"];
                      return [value, "Quantity"];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="quantity"
                    fill="hsl(var(--primary))"
                    name="Quantity"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--secondary))"
                    name="Revenue"
                    radius={[8, 8, 0, 0]}
                  />
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
                      <TableHead className="text-right">
                        Quantity Sold
                      </TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.itemSales.map((item: any, index: number) => (
                      <TableRow
                        key={item.itemName}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <Badge
                                variant={index === 0 ? "default" : "secondary"}
                                className="gap-1"
                              >
                                {index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉"}
                              </Badge>
                            )}
                            {item.itemName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatNumber(item.quantitySold)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
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
