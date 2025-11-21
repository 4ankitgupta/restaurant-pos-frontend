# Reports Module - Developer Guide

## Overview

This directory contains all report components for the RasoiTrack POS system. Each report follows a consistent pattern using the `ReportLayout` component and shared utilities.

---

## Directory Structure

```
components/reports/
├── CategorySalesReport.tsx           # Existing: Sales by category
├── DailyClosingReport.tsx            # Existing: Z-Report
├── DateRangePicker.tsx               # Enhanced: Date range with presets
├── ItemWiseSalesReport.tsx           # Existing: Sales by menu item
├── OrderCancellationReport.tsx       # Existing: Cancelled orders
├── PaymentSummaryReport.tsx          # Existing: Payment methods breakdown
├── ReportLayout.tsx                  # Shared: Layout wrapper for all reports
├── SalesSummaryReport.tsx            # Existing: Overall sales summary
├── StockConsumptionReport.tsx        # Existing: Stock usage (Admin only)
├── StockLevelReport.tsx              # Existing: Current inventory levels
│
├── InventoryVarianceReport.tsx       # NEW: Wastage & shrinkage tracking
├── MenuItemProfitabilityReport.tsx   # NEW: Profit margin analysis
├── SalesByHourReport.tsx             # NEW: Hourly sales heatmap
├── TaxComplianceReport.tsx           # NEW: GST breakdown
├── SalesByEmployeeReport.tsx         # NEW: Staff performance
├── DiscountAnalysisReport.tsx        # NEW: Discount effectiveness (placeholder)
└── ExportButtons.tsx                 # NEW: Reusable export component
```

---

## Creating a New Report

### 1. Backend Setup

#### Step 1: Add Service Function

**File:** `restaurant-pos-backend/src/modules/reports/reports.service.ts`

```typescript
export const generateMyNewReport = async (restaurantId: string, query: any) => {
  const filters = getCommonFilters(restaurantId, query);

  // Your query logic here
  const data = await prisma.model.findMany({
    where: filters,
    include: {
      /* relations */
    },
  });

  // Process and return
  return {
    reportMeta: { ...query, generatedAt: new Date() },
    summary: {
      /* key metrics */
    },
    data: {
      /* detailed data */
    },
  };
};
```

#### Step 2: Add Controller

**File:** `restaurant-pos-backend/src/modules/reports/reports.controller.ts`

```typescript
export const getMyNewReport = handleReportRequest(
  reportService.generateMyNewReport
);
```

#### Step 3: Add Route

**File:** `restaurant-pos-backend/src/modules/reports/reports.routes.ts`

```typescript
router.get(
  "/my-new-report",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getMyNewReport
);
```

---

### 2. Frontend Component

#### Template Structure

**File:** `restaurant-pos-frontend/src/components/reports/MyNewReport.tsx`

```typescript
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportLayout } from "./ReportLayout";
import { formatCurrency } from "@/lib/reportFormatting";

const MyNewReport = () => {
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
      const response = await apiService.getReport("my-new-report", params);
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
      {/* Add more filters here */}
      <Button onClick={handleGenerateReport} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Report"}
      </Button>
    </>
  );

  return (
    <ReportLayout
      title="My New Report"
      subtitle="Description of what this report shows"
      filters={filters}
      isLoading={isLoading}
      error={error}
      reportData={reportData}
    >
      {!reportData ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Please select a date range and click "Generate Report".
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Key Metric 1</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(reportData.summary.value)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table/Chart */}
          {/* Your visualization here */}
        </div>
      )}
    </ReportLayout>
  );
};

export default MyNewReport;
```

---

### 3. Register the Report

**File:** `restaurant-pos-frontend/src/pages/Reports.tsx`

```typescript
import MyNewReport from "@/components/reports/MyNewReport";

const allReports = [
  // ... existing reports
  {
    value: "my-new-report",
    label: "📊 My New Report",
    roles: ["manager", "admin"],
    component: MyNewReport,
  },
];
```

---

## Shared Utilities

### Formatting (`lib/reportFormatting.ts`)

```typescript
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
} from "@/lib/reportFormatting";

// Currency (INR)
formatCurrency(1234.56); // "₹1,234.56"

// Percentage
formatPercentage(45.67); // "45.7%"

// Number
formatNumber(12345.678); // "12,345.68"
```

### Color Coding (`lib/reportFormatting.ts`)

```typescript
import {
  getSummaryCardClasses,
  getSummaryValueColor
} from "@/lib/reportFormatting";

// Card background color
<Card className={getSummaryCardClasses("success")}>
  // success | warning | danger | info | neutral
</Card>

// Text color
<div className={getSummaryValueColor("success")}>
  Value
</div>
```

### Export (`lib/exportUtils.ts`)

```typescript
import { exportToCSV } from "@/lib/exportUtils";

const handleExport = () => {
  exportToCSV(reportData.data, "my-report");
};
```

---

## Common Patterns

### 1. Summary Cards with Color Coding

```typescript
<Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
  <CardHeader className="pb-2">
    <CardTitle className="text-base text-muted-foreground font-medium">
      Metric Name
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-green-600">
      {formatCurrency(value)}
    </div>
    <p className="text-sm text-muted-foreground mt-1">Description</p>
  </CardContent>
</Card>
```

### 2. Data Tables

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead className="text-right">Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id} className="hover:bg-muted/50">
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell className="text-right">
          {formatCurrency(item.value)}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 3. Filters

```typescript
<Select value={filter} onValueChange={setFilter}>
  <SelectTrigger className="w-full md:w-[180px]">
    <SelectValue placeholder="Filter by..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ALL">All</SelectItem>
    <SelectItem value="OPTION1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### 4. Charts (using recharts)

```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

<ResponsiveContainer width="100%" height={400}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="label" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>;
```

---

## Best Practices

### 1. State Management

- Always reset `reportData` when generating new report
- Show loading state during API calls
- Handle errors gracefully

### 2. Data Validation

- Validate date ranges
- Handle empty datasets
- Check for null/undefined values

### 3. Performance

- Limit initial data fetch
- Use pagination for large datasets
- Optimize database queries

### 4. Accessibility

- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation

### 5. Responsive Design

- Test on mobile devices
- Use responsive grid classes
- Make tables scrollable

---

## Testing Checklist

For each new report:

- [ ] Backend endpoint returns correct data structure
- [ ] Frontend renders without errors
- [ ] Date filters work correctly
- [ ] Export functionality works
- [ ] Loading states display properly
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] Color coding is appropriate
- [ ] Performance is acceptable

---

## Troubleshooting

### "Cannot read property of undefined"

- Check API response structure
- Add optional chaining (`?.`)
- Provide fallback values

### "Report shows no data"

- Verify date range has data
- Check authentication/permissions
- Inspect backend query filters

### "Chart not rendering"

- Ensure recharts is installed
- Check data format matches chart requirements
- Verify ResponsiveContainer has height

---

## Dependencies

### Required

- `react` - UI framework
- `recharts` - Charts and visualizations
- `date-fns` - Date manipulation
- `lucide-react` - Icons

### Optional

- `jspdf` - PDF export
- `jspdf-autotable` - PDF tables

---

## API Response Structure

All reports should return:

```typescript
{
  statusCode: 200,
  data: {
    reportMeta: {
      startDate?: string,
      endDate?: string,
      generatedAt: Date,
      // ... other filters
    },
    summary: {
      // Key metrics
    },
    // Detailed data arrays
  },
  message: "Report generated successfully",
  success: true
}
```

---

## Related Documentation

- [New Reports Implementation Guide](../../NEW_REPORTS_IMPLEMENTATION.md)
- [Quick Start Guide](../../QUICK_START_REPORTS.md)
- [Executive Summary](../../EXECUTIVE_SUMMARY_REPORTS.md)
- [Deployment Checklist](../../DEPLOYMENT_CHECKLIST.md)

---

**Last Updated:** November 22, 2025  
**Maintained By:** Development Team
