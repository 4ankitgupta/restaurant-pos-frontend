import { useState, useEffect } from "react";
import { apiService } from "@/services/apiService";
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
import { Button } from "../ui/button";
import { ExportButtons } from "./ExportButtons";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Package } from "lucide-react";

const StockLevelReport = () => {
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getReport("stock-level");
      setReportData(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch report.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const lowStockItems =
    reportData?.stockLevels.filter(
      (item: any) => item.currentStock <= item.reorderLevel
    ) || [];

  const filters = (
    <>
      <Button onClick={fetchReport} disabled={isLoading}>
        {isLoading ? "Refreshing..." : "Refresh"}
      </Button>
      {reportData && (
        <ExportButtons
          data={reportData.stockLevels}
          filename="stock-level-report"
          reportTitle="Stock Level Report"
        />
      )}
    </>
  );

  return (
    <ReportLayout
      title="Current Stock Level Report"
      subtitle="Real-time inventory levels and reorder alerts"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-muted-foreground font-medium">
                  Total Items
                </CardTitle>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {reportData?.stockLevels.length || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Inventory items tracked
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950 dark:to-red-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-muted-foreground font-medium">
                  Low Stock Alerts
                </CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {lowStockItems.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Items need reordering
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-muted-foreground font-medium">
                  Healthy Stock
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {(reportData?.stockLevels.length || 0) - lowStockItems.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Items above reorder level
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Stock %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.stockLevels.map((item: any) => {
                    const isLowStock = item.currentStock <= item.reorderLevel;
                    const stockPercentage =
                      (item.currentStock / (item.reorderLevel * 2)) * 100;
                    return (
                      <TableRow
                        key={item.id}
                        className={
                          isLowStock
                            ? "bg-red-50 dark:bg-red-950/20"
                            : "hover:bg-muted/50"
                        }
                      >
                        <TableCell>
                          {isLowStock ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 text-green-600 border-green-600"
                            >
                              <CheckCircle className="h-3 w-3" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.currentStock}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.reorderLevel}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isLowStock ? "bg-red-600" : "bg-green-600"
                                }`}
                                style={{
                                  width: `${Math.min(stockPercentage, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10">
                              {stockPercentage.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ReportLayout>
  );
};

export default StockLevelReport;
