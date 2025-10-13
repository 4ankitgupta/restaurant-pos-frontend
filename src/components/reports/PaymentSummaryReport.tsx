import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportLayout } from "./ReportLayout";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

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
      title="Payment Summary Report"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      <Card className="md:w-1/2">
        <CardHeader>
          <CardTitle>Total Collection by Payment Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-lg">
          {reportData &&
            Object.entries(reportData.paymentSummary).map(([key, value]) => (
              <div className="flex justify-between" key={key}>
                <span className="capitalize">{key.toLowerCase()}:</span>
                <strong>{formatCurrency(value as number)}</strong>
              </div>
            ))}
          <hr className="my-2 !mt-4" />
          <div className="flex justify-between font-bold text-xl">
            <span>Total Collected:</span>
            <span>{formatCurrency(reportData?.totalCollected)}</span>
          </div>
        </CardContent>
      </Card>
    </ReportLayout>
  );
};

export default PaymentSummaryReport;
