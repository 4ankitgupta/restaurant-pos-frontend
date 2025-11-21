import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportLayout } from "./ReportLayout";
import { ExportButtons } from "./ExportButtons";
import { formatCurrency } from "@/lib/reportFormatting";
import { Wallet, CreditCard, Banknote, Smartphone } from "lucide-react";

const PaymentSummaryReport = () => {
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
      const response = await apiService.getReport("payment-summary", params);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethodIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    CASH: Banknote,
    CARD: CreditCard,
    UPI: Smartphone,
    OTHER: Wallet,
  };

  const filters = (
    <>
      <DateRangePicker onDateChange={setDateRange} />
      <Button onClick={handleGenerateReport} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Report"}
      </Button>
      {reportData && (
        <ExportButtons
          data={Object.entries(reportData.paymentSummary).map(
            ([method, amount]) => ({
              paymentMethod: method,
              amount,
            })
          )}
          filename="payment-summary-report"
          reportTitle="Payment Summary Report"
        />
      )}
    </>
  );

  return (
    <ReportLayout
      title="Payment Summary Report"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <CardTitle>Total Collection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {formatCurrency(reportData?.totalCollected)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All payment methods combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportData &&
              Object.entries(reportData.paymentSummary).map(([key, value]) => {
                const Icon = paymentMethodIcons[key] || Wallet;
                const amount = value as number;
                const percentage = (amount / reportData.totalCollected) * 100;
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium capitalize">
                          {key.toLowerCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </ReportLayout>
  );
};

export default PaymentSummaryReport;
