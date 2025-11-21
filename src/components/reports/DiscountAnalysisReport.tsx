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
import { Tag, TrendingDown, ShoppingCart } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const DiscountAnalysisReport = () => {
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
      const response = await apiService.getReport("discount-analysis", params);
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
      title="Discount & Promotion Analysis Report"
      subtitle="Measure the effectiveness and cost of promotions"
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
          {/* Feature Not Implemented Notice */}
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Discount System Not Yet Implemented</strong>
              <p className="mt-2">
                To enable this report, you need to add discount tracking
                functionality to your POS system:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  Add discount fields to the Order model (discountAmount,
                  discountType, discountCode)
                </li>
                <li>
                  Create a Discount/Promotion model to track promotion codes and
                  rules
                </li>
                <li>
                  Update the order creation flow to apply and record discounts
                </li>
                <li>Link discounts to employees who authorize them</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Placeholder Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Total Discount Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(reportData.summary.totalDiscountAmount)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Revenue foregone
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  Orders with Discount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reportData.summary.totalOrdersWithDiscount}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total discounted orders
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-600" />
                  Avg Discount per Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(reportData.summary.averageDiscountPerOrder)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Average discount value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Net Sales Card */}
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle>Net Sales After Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {formatCurrency(reportData.summary.netSalesAfterDiscount)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Actual revenue received after applying all discounts
              </p>
            </CardContent>
          </Card>

          {/* Placeholder Table */}
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle>Discount Breakdown by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Discount Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Orders Used</TableHead>
                      <TableHead className="text-right">
                        Total Discount
                      </TableHead>
                      <TableHead className="text-right">
                        Avg per Order
                      </TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.discounts.map(
                      (discount: any, index: number) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {discount.discountName}
                          </TableCell>
                          <TableCell>{discount.discountType}</TableCell>
                          <TableCell className="text-right">
                            {discount.totalOrdersUsedIn}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {formatCurrency(discount.totalDiscountAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(discount.averageDiscountPerOrder)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(discount.netSalesAfterDiscount)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Guide */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">
                📋 Implementation Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Step 1: Update Database Schema
                </h4>
                <p className="text-sm text-muted-foreground">
                  Add the following fields to your Order model: discountAmount
                  (Decimal), discountType (String), discountCode (String),
                  authorizedBy (User relation).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Step 2: Create Promotion Model
                </h4>
                <p className="text-sm text-muted-foreground">
                  Create a new Promotion/Coupon model with fields: code,
                  discountType (PERCENTAGE/FIXED), value, startDate, endDate,
                  maxUses, usageCount.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Step 3: Update Order Flow
                </h4>
                <p className="text-sm text-muted-foreground">
                  Modify the cashier and waiter order screens to allow applying
                  discounts/coupons. Add validation logic and permission checks
                  (e.g., only managers can approve discounts {">"}10%).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Step 4: Update Report Service
                </h4>
                <p className="text-sm text-muted-foreground">
                  Update the generateDiscountAnalysisReport function to query
                  actual discount data from the database instead of returning
                  placeholder data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default DiscountAnalysisReport;
