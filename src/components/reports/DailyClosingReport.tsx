import { useState } from "react";
import { format } from "date-fns";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportLayout } from "./ReportLayout";

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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Sales:</span>{" "}
              <strong>{formatCurrency(reportData?.sales.totalSales)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Net Sales:</span>{" "}
              <strong>{formatCurrency(reportData?.sales.netSales)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>{" "}
              <strong>{formatCurrency(reportData?.sales.totalDiscount)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Orders:</span>{" "}
              <strong>{reportData?.sales.orderCount}</strong>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportData &&
              reportData.payments &&
              reportData.payments.paymentSummary &&
              Object.entries(reportData.payments.paymentSummary).map(
                ([key, value]) => (
                  <div className="flex justify-between" key={key}>
                    <span className="capitalize">{key.toLowerCase()}:</span>
                    <strong>{formatCurrency(value as number)}</strong>
                  </div>
                )
              )}
            <hr className="my-2" />
            <div className="flex justify-between text-lg">
              <strong>Total Collected:</strong>{" "}
              <strong>
                {formatCurrency(reportData?.payments.totalCollected)}
              </strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </ReportLayout>
  );
};

export default DailyClosingReport;
