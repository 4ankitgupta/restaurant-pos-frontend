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

  const filters = (
    <Button onClick={fetchReport} disabled={isLoading}>
      {isLoading ? "Refreshing..." : "Refresh"}
    </Button>
  );

  return (
    <ReportLayout
      title="Current Stock Level Report"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      <Card>
        <CardHeader>
          <CardTitle>Inventory Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData?.stockLevels.map((item: any) => (
                <TableRow
                  key={item.id}
                  className={
                    item.currentStock <= item.reorderLevel
                      ? "bg-red-900/50"
                      : ""
                  }
                >
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">
                    {item.currentStock}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.reorderLevel}
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

export default StockLevelReport;
