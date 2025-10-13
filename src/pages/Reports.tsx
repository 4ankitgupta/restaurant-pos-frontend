import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SalesSummaryReport from "@/components/reports/SalesSummaryReport";
import ItemWiseSalesReport from "@/components/reports/ItemWiseSalesReport";
import CategorySalesReport from "@/components/reports/CategorySalesReport";
import StockLevelReport from "@/components/reports/StockLevelReport";
import DailyClosingReport from "@/components/reports/DailyClosingReport";
import PaymentSummaryReport from "@/components/reports/PaymentSummaryReport";
import OrderCancellationReport from "@/components/reports/OrderCancellationReport";
import StockConsumptionReport from "@/components/reports/StockConsumptionReport";

const allReports = [
  {
    value: "sales-summary",
    label: "Sales Summary Report",
    roles: ["manager", "admin"],
    component: SalesSummaryReport,
  },
  {
    value: "item-wise-sales",
    label: "Item-wise Sales Report",
    roles: ["manager", "admin"],
    component: ItemWiseSalesReport,
  },
  {
    value: "category-sales",
    label: "Category Sales Report",
    roles: ["manager", "admin"],
    component: CategorySalesReport,
  },
  {
    value: "daily-closing",
    label: "Daily Closing (Z-Report)",
    roles: ["manager", "admin"],
    component: DailyClosingReport,
  },
  {
    value: "payment-summary",
    label: "Payment Summary Report",
    roles: ["manager", "admin"],
    component: PaymentSummaryReport,
  },
  {
    value: "order-cancellation",
    label: "Order Cancellation Report",
    roles: ["manager", "admin"],
    component: OrderCancellationReport,
  },
  {
    value: "stock-level",
    label: "Stock Level Report",
    roles: ["manager", "admin"],
    component: StockLevelReport,
  },
  {
    value: "stock-consumption",
    label: "Stock Consumption Report (Admin)",
    roles: ["admin"],
    component: StockConsumptionReport,
  },
];

const Reports = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const availableReports = user
    ? allReports.filter((report) => report.roles.includes(user.role))
    : [];

  const CurrentReport = allReports.find(
    (r) => r.value === selectedReport
  )?.component;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Reports</h1>
        <div className="w-full md:w-auto">
          <Select
            onValueChange={setSelectedReport}
            value={selectedReport || ""}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a report to view" />
            </SelectTrigger>
            <SelectContent>
              {availableReports.map((report) => (
                <SelectItem key={report.value} value={report.value}>
                  {report.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          {CurrentReport ? (
            <CurrentReport />
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                Please select a report to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
