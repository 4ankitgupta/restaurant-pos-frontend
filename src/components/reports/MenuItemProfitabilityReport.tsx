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
import { TrendingUp, DollarSign, PieChart } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const MenuItemProfitabilityReport = () => {
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
      const response = await apiService.getReport(
        "menu-item-profitability",
        params
      );
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

  const getProfitabilityBadge = (margin: number) => {
    if (margin >= 60) return <Badge className="bg-green-500">Star</Badge>;
    if (margin >= 40) return <Badge className="bg-blue-500">Good</Badge>;
    if (margin >= 25) return <Badge variant="secondary">Average</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

  return (
    <ReportLayout
      title="Costing & Profitability Report"
      subtitle="Analyze profit margins and identify your star performers"
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
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  From {reportData.summary.itemsAnalyzed} items
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(reportData.summary.totalProfit)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Gross profit margin
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-600" />
                  Average Margin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {reportData.summary.averageMargin.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Overall profitability
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profitability Table */}
          <Card>
            <CardHeader>
              <CardTitle>Item Profitability (Sorted by Margin %)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">COGS</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">
                        Total Revenue
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.profitabilityData.map((item: any) => (
                      <TableRow key={item.itemId} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {item.itemName}
                        </TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.sellingPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.costOfGoodsSold)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(item.grossProfit)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {item.grossProfitMarginPercentage.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantitySold}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.totalRevenue)}
                        </TableCell>
                        <TableCell>
                          {getProfitabilityBadge(
                            item.grossProfitMarginPercentage
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Star</Badge>
                  <span className="text-sm">≥60% margin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">Good</Badge>
                  <span className="text-sm">40-59% margin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Average</Badge>
                  <span className="text-sm">25-39% margin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Low</Badge>
                  <span className="text-sm">&lt;25% margin</span>
                </div>
              </div>
              <p className="text-sm text-blue-800 mt-4">
                <strong>Note:</strong> COGS (Cost of Goods Sold) is currently
                estimated. Configure recipes with ingredient costs for accurate
                profitability tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default MenuItemProfitabilityReport;
