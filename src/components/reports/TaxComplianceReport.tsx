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
import { FileText, Receipt, TrendingUp } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const TaxComplianceReport = () => {
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
      const response = await apiService.getReport("tax-compliance", params);
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
      title="Tax Compliance Report (GST)"
      subtitle="Simplified government tax filing with daily breakdown"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  Taxable Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.summary.totalGrossTaxableSales)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">
                  CGST Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.summary.totalCGST)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">
                  SGST Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.summary.totalSGST)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Total GST
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(reportData.summary.totalGST)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Net Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(reportData.summary.totalNetSales)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Including all taxes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {reportData.summary.totalOrders}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  In selected period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Tax Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Tax Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">
                        Taxable Sales
                      </TableHead>
                      <TableHead className="text-right">CGST (9%)</TableHead>
                      <TableHead className="text-right">SGST (9%)</TableHead>
                      <TableHead className="text-right">Total GST</TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.taxData.map((day: any) => (
                      <TableRow key={day.date} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {format(new Date(day.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {day.orderCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(day.grossTaxableSales)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(day.cgstCollected)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(day.sgstCollected)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-purple-600">
                          {formatCurrency(day.totalGST)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(day.totalNetSales)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Export Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                <strong>📥 Export Required:</strong> Use the "Export to
                CSV/Excel" button to download this report for tax filing
                purposes. The exported file can be directly uploaded to GST
                portal or shared with your accountant.
              </p>
            </CardContent>
          </Card>

          {/* Tax Calculation Note */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Note:</strong> Tax calculation assumes 18% GST (9%
                CGST + 9% SGST) on all items. For accurate tax reporting,
                configure tax rates per menu item category (e.g., 5% for
                restaurant services, 12% for takeaway).
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default TaxComplianceReport;
