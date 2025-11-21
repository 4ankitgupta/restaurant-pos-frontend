import { useState } from "react";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  onDateChange: (range: DateRange | undefined) => void;
  className?: string;
}

// Date preset configurations
const datePresets = [
  {
    label: "Today",
    getValue: () => ({ from: new Date(), to: new Date() }),
  },
  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: "Last 7 Days",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "Current Month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "Last Month",
    getValue: () => {
      const lastMonth = subDays(startOfMonth(new Date()), 1);
      return {
        from: startOfMonth(lastMonth),
        to: lastMonth,
      };
    },
  },
  {
    label: "Current FY (Apr 1st)",
    getValue: () => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const financialYearStart = new Date(
        currentMonth >= 3 ? currentYear : currentYear - 1,
        3,
        1
      ); // April 1st
      return {
        from: financialYearStart,
        to: new Date(),
      };
    },
  },
];

export function DateRangePicker({
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    onDateChange(selectedDate);
  };

  const handlePresetClick = (preset: (typeof datePresets)[0]) => {
    const range = preset.getValue();
    handleDateSelect(range);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {datePresets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Calendar Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full md:w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
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
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
