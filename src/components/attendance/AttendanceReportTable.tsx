import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, ChevronDown } from "lucide-react";
import { AttendanceReport } from "@/types/employee";
import { format } from "date-fns";

interface AttendanceReportTableProps {
  data: AttendanceReport[];
  loading: boolean;
}

export function AttendanceReportTable({
  data,
  loading,
}: AttendanceReportTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading attendance data...</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Attendance Records</h3>
          <p className="text-muted-foreground">
            No attendance records found for the selected filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Punches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((employee) => (
                <TableRow key={employee.employeeId}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.employeeCode}</TableCell>
                  <TableCell>{employee.designation || "N/A"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.status === "IN" ? "default" : "secondary"}
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.totalHoursWorked}</TableCell>
                  <TableCell>
                    {employee.punches.length > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            View ({employee.punches.length})
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Punch Records</h4>
                            {employee.punches.map((punch, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm py-1 border-b last:border-0"
                              >
                                <Badge
                                  variant={
                                    punch.type === "IN" ? "default" : "outline"
                                  }
                                >
                                  {punch.type}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {format(new Date(punch.time), "hh:mm a")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No punches
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
