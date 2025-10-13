import { useState } from "react";
import { format } from "date-fns";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportLayout } from "./ReportLayout";
import { IndianRupee, Receipt, CreditCard, Percent } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const DailyClosingReport = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!date) {
      setError("Please select a date.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setReportData(null);
    const params = { date: format(date, "yyyy-MM-dd") };

    try {
      const response = await apiService.getReport("daily-closing", params);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setIsLoading(false);
    }
  };

  const filters = (
    <div className="flex items-start gap-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
      <Button onClick={handleGenerateReport} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate for Selected Date"}
      </Button>
    </div>
  );

  return (
    <ReportLayout
      title="Daily Closing Report (Z-Report)"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      {!reportData ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Please select a date and click "Generate for Selected Date" to view report.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(reportData?.sales.totalSales || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData?.sales.netSales || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(reportData?.sales.totalDiscount || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.sales.orderCount || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData &&
                  reportData.payments &&
                  reportData.payments.paymentSummary &&
                  Object.entries(reportData.payments.paymentSummary).map(
                    ([key, value]) => (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30" key={key}>
                        <span className="capitalize font-medium">{key.toLowerCase()}</span>
                        <span className="text-lg font-bold">{formatCurrency(value as number)}</span>
                      </div>
                    )
                  )}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <span className="text-lg font-bold">Total Collected</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(reportData?.payments.totalCollected || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ReportLayout>
  );
};

export default DailyClosingReport;
