import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, UserPlus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { useApi } from "@/hooks/useApi";
import { AttendanceReport as AttendanceReportType } from "@/types/employee";
import { AttendanceReportTable } from "@/components/attendance/AttendanceReportTable";
import { ManualPunchDialog } from "@/components/attendance/ManualPunchDialog";

type ViewType = "today" | "week" | "month" | "custom";

const AttendanceReport: React.FC = () => {
  const [view, setView] = useState<ViewType>("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [designationFilter, setDesignationFilter] = useState<string>("all");
  const [attendanceData, setAttendanceData] = useState<AttendanceReportType[]>([]);
  const [isManualPunchOpen, setIsManualPunchOpen] = useState(false);

  const { loading, execute: fetchAttendance } = useApi<{
    data: AttendanceReportType[];
  }>();

  useEffect(() => {
    loadAttendanceData();
  }, [view, dateRange]);

  const loadAttendanceData = async () => {
    const { startDate, endDate } = getDateRange();
    
    try {
      const response = await fetchAttendance(() =>
        apiService.getAttendanceReport(
          startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          endDate ? format(endDate, "yyyy-MM-dd") : undefined
        )
      );
      if (response) {
        setAttendanceData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    
    switch (view) {
      case "today":
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now),
        };
      case "week":
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now),
        };
      case "month":
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
      case "custom":
        return {
          startDate: dateRange?.from,
          endDate: dateRange?.to,
        };
      default:
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now),
        };
    }
  };

  // Get unique designations from data
  const uniqueDesignations = Array.from(
    new Set(
      attendanceData
        .map((emp) => emp.designation)
        .filter((d): d is string => !!d)
    )
  );

  // Apply filters
  const filteredData = attendanceData.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDesignation =
      designationFilter === "all" || emp.designation === designationFilter;

    return matchesSearch && matchesDesignation;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Attendance Report</h1>
        <Button onClick={() => setIsManualPunchOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Manual Punch
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* View Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">View</label>
              <Select
                value={view}
                onValueChange={(value) => setView(value as ViewType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Picker (only for custom) */}
            {view === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Designation Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Designation</label>
              <Select
                value={designationFilter}
                onValueChange={setDesignationFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {uniqueDesignations.map((designation) => (
                    <SelectItem key={designation} value={designation}>
                      {designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <AttendanceReportTable data={filteredData} loading={loading} />

      {/* Manual Punch Dialog */}
      <ManualPunchDialog
        open={isManualPunchOpen}
        onOpenChange={setIsManualPunchOpen}
        onSuccess={loadAttendanceData}
      />
    </div>
  );
};

export default AttendanceReport;
