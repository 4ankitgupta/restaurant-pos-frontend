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
import { AlertTriangle, TrendingDown } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const InventoryVarianceReport = () => {
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
      const response = await apiService.getReport("inventory-variance", params);
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
      title="Inventory Variance / Wastage Report"
      subtitle="Track shrinkage, wastage, and theft by comparing theoretical vs actual usage"
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
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Total Variance Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(reportData.summary.totalVarianceCost)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total wastage/shrinkage value
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  High Variance Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {reportData.summary.highVarianceItems}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Items with {">"}5% variance
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium">
                  Items with Variance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reportData.summary.itemsWithVariance}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Variance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Variance Details (Sorted by Cost Impact)</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.varianceData.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No variance detected in the selected period. Great job! 🎉
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">
                          Theoretical
                        </TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">
                          Variance Qty
                        </TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">
                          Cost Impact
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.varianceData.map((item: any) => {
                        const variancePercent =
                          item.theoreticalConsumption > 0
                            ? Math.abs(
                                (item.varianceQuantity /
                                  item.theoreticalConsumption) *
                                  100
                              )
                            : 0;
                        const isHighVariance = variancePercent > 5;

                        return (
                          <TableRow
                            key={item.itemId}
                            className={`hover:bg-muted/50 ${
                              isHighVariance ? "bg-red-50" : ""
                            }`}
                          >
                            <TableCell className="font-medium">
                              {item.itemName}
                              {isHighVariance && (
                                <Badge variant="destructive" className="ml-2">
                                  High
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">
                              {item.theoreticalConsumption.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.actualConsumption.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {item.varianceQuantity > 0 ? "+" : ""}
                              {item.varianceQuantity.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.latestUnitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-red-600">
                              {formatCurrency(Math.abs(item.costOfVariance))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note about recipe requirement */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Theoretical consumption calculation
                requires recipe data to be configured for accurate variance
                tracking. Currently showing actual consumption from stock logs
                only.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default InventoryVarianceReport;
