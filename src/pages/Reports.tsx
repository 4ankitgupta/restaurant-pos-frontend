import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import SalesSummaryReport from "@/components/reports/SalesSummaryReport";
import ItemWiseSalesReport from "@/components/reports/ItemWiseSalesReport";
import CategorySalesReport from "@/components/reports/CategorySalesReport";
import StockLevelReport from "@/components/reports/StockLevelReport";
import DailyClosingReport from "@/components/reports/DailyClosingReport";
import PaymentSummaryReport from "@/components/reports/PaymentSummaryReport";
import OrderCancellationReport from "@/components/reports/OrderCancellationReport";
import StockConsumptionReport from "@/components/reports/StockConsumptionReport";
import InventoryVarianceReport from "@/components/reports/InventoryVarianceReport";
import MenuItemProfitabilityReport from "@/components/reports/MenuItemProfitabilityReport";
import SalesByHourReport from "@/components/reports/SalesByHourReport";
import TaxComplianceReport from "@/components/reports/TaxComplianceReport";
import SalesByEmployeeReport from "@/components/reports/SalesByEmployeeReport";
import DiscountAnalysisReport from "@/components/reports/DiscountAnalysisReport";
import AttendanceSummaryReport from "@/components/reports/AttendanceSummaryReport";
import {
  TrendingUp,
  DollarSign,
  Package,
  ClipboardList,
  Users,
  BarChart3,
  ShoppingCart,
  PieChart,
  FileText,
  Wallet,
  XCircle,
  PackageCheck,
  AlertTriangle,
  Calculator,
  Clock,
  FileCheck,
  Tag,
} from "lucide-react";

interface ReportItem {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  component: React.ComponentType;
  category: string;
  priority?: "high" | "medium" | "low";
}

const allReports: ReportItem[] = [
  // SALES CATEGORY
  {
    value: "sales-summary",
    label: "Sales Summary",
    description: "Overall sales performance and trends",
    icon: TrendingUp,
    roles: ["manager", "admin"],
    component: SalesSummaryReport,
    category: "sales",
    priority: "high",
  },
  {
    value: "sales-by-hour",
    label: "Sales by Hour",
    description: "Hourly sales heatmap and peak time analysis",
    icon: Clock,
    roles: ["manager", "admin"],
    component: SalesByHourReport,
    category: "sales",
    priority: "high",
  },
  {
    value: "item-wise-sales",
    label: "Item-wise Sales",
    description: "Sales performance by menu item",
    icon: ShoppingCart,
    roles: ["manager", "admin"],
    component: ItemWiseSalesReport,
    category: "sales",
    priority: "medium",
  },
  {
    value: "category-sales",
    label: "Category Sales",
    description: "Sales breakdown by menu category",
    icon: PieChart,
    roles: ["manager", "admin"],
    component: CategorySalesReport,
    category: "sales",
    priority: "medium",
  },

  // FINANCIAL CATEGORY
  {
    value: "daily-closing",
    label: "Daily Closing (Z-Report)",
    description: "End-of-day financial summary",
    icon: FileText,
    roles: ["manager", "admin"],
    component: DailyClosingReport,
    category: "financial",
    priority: "high",
  },
  {
    value: "payment-summary",
    label: "Payment Summary",
    description: "Payment methods breakdown and collection",
    icon: Wallet,
    roles: ["manager", "admin"],
    component: PaymentSummaryReport,
    category: "financial",
    priority: "high",
  },
  {
    value: "tax-compliance",
    label: "Tax Compliance (GST)",
    description: "GST breakdown and tax compliance report",
    icon: FileCheck,
    roles: ["manager", "admin"],
    component: TaxComplianceReport,
    category: "financial",
    priority: "high",
  },
  {
    value: "menu-item-profitability",
    label: "Costing & Profitability",
    description: "COGS, margins, and profit analysis",
    icon: Calculator,
    roles: ["manager", "admin"],
    component: MenuItemProfitabilityReport,
    category: "financial",
    priority: "high",
  },
  {
    value: "discount-analysis",
    label: "Discount Analysis",
    description: "Discount effectiveness and promotion ROI",
    icon: Tag,
    roles: ["manager", "admin"],
    component: DiscountAnalysisReport,
    category: "financial",
    priority: "low",
  },

  // INVENTORY CATEGORY
  {
    value: "stock-level",
    label: "Stock Level",
    description: "Current inventory levels and reorder alerts",
    icon: Package,
    roles: ["manager", "admin"],
    component: StockLevelReport,
    category: "inventory",
    priority: "high",
  },
  {
    value: "stock-consumption",
    label: "Stock Consumption",
    description: "Detailed stock usage analysis (Admin only)",
    icon: PackageCheck,
    roles: ["admin"],
    component: StockConsumptionReport,
    category: "inventory",
    priority: "medium",
  },
  {
    value: "inventory-variance",
    label: "Inventory Variance",
    description: "Wastage, shrinkage, and variance tracking",
    icon: AlertTriangle,
    roles: ["manager", "admin"],
    component: InventoryVarianceReport,
    category: "inventory",
    priority: "high",
  },

  // OPERATIONS CATEGORY
  {
    value: "order-cancellation",
    label: "Order Cancellation",
    description: "Cancelled orders tracking and reasons",
    icon: XCircle,
    roles: ["manager", "admin"],
    component: OrderCancellationReport,
    category: "operations",
    priority: "medium",
  },

  // STAFF CATEGORY
  {
    value: "sales-by-employee",
    label: "Staff Performance",
    description: "Employee sales performance and rankings",
    icon: Users,
    roles: ["manager", "admin"],
    component: SalesByEmployeeReport,
    category: "staff",
    priority: "high",
  },
  {
    value: "attendance-log",
    label: "Attendance Log",
    description: "Employee attendance tracking and working hours",
    icon: Clock,
    roles: ["manager", "admin"],
    component: AttendanceSummaryReport,
    category: "staff",
    priority: "high",
  },
];

const categoryConfig = {
  sales: {
    label: "Sales & Revenue",
    icon: BarChart3,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  financial: {
    label: "Financial",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  inventory: {
    label: "Inventory",
    icon: Package,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  operations: {
    label: "Operations",
    icon: ClipboardList,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  staff: {
    label: "Staff",
    icon: Users,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950",
  },
};

const Reports = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("sales");

  const availableReports = user
    ? allReports.filter((report) => report.roles.includes(user.role))
    : [];

  const reportsByCategory = availableReports.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, ReportItem[]>);

  const CurrentReport = allReports.find(
    (r) => r.value === selectedReport
  )?.component;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business insights and data analysis
          </p>
        </div>
        {selectedReport && (
          <Badge variant="outline" className="mt-2 md:mt-0">
            {allReports.find((r) => r.value === selectedReport)?.label}
          </Badge>
        )}
      </div>

      {!selectedReport ? (
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const CategoryIcon = config.icon;
              const count = reportsByCategory[key]?.length || 0;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2 py-3"
                >
                  <CategoryIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(categoryConfig).map(([category, config]) => {
            const CategoryIcon = config.icon;
            return (
              <TabsContent
                key={category}
                value={category}
                className="space-y-4"
              >
                <div className={`p-4 rounded-lg ${config.bgColor} border`}>
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={`h-5 w-5 ${config.color}`} />
                    <h2 className="text-xl font-semibold">
                      {config.label} Reports
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportsByCategory[category]?.map((report) => {
                    const ReportIcon = report.icon;
                    return (
                      <Card
                        key={report.value}
                        className="cursor-pointer hover:shadow-lg transition-all hover:border-primary group"
                        onClick={() => setSelectedReport(report.value)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className={`p-3 rounded-lg ${config.bgColor} group-hover:scale-110 transition-transform`}
                            >
                              <ReportIcon
                                className={`h-6 w-6 ${config.color}`}
                              />
                            </div>
                            {report.priority === "high" && (
                              <Badge variant="default" className="bg-red-500">
                                Priority
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                            {report.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedReport(null)}
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
          >
            ← Back to Reports
          </button>
          <Card>
            <CardContent className="p-6">
              {CurrentReport && <CurrentReport />}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
