"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  maxDate,
  disabledDates,
  className,
  id,
  name,
  clearable = true,
  ...props
}) {
  const [open, setOpen] = React.useState(false);

  // Parse string / date input into Date object without timezone shift
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      // Handle YYYY-MM-DD or YYYY-MM-DDT...
      const cleanDate = trimmed.split("T")[0];
      const parts = cleanDate.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return isValid(d) ? d : undefined;
      }
      const parsed = parseISO(trimmed);
      return isValid(parsed) ? parsed : undefined;
    }
    return undefined;
  }, [value]);

  // Convert minDate / maxDate if strings
  const parsedMinDate = React.useMemo(() => {
    if (!minDate) return undefined;
    if (minDate instanceof Date) return minDate;
    if (typeof minDate === "string") {
      const cleanDate = minDate.trim().split("T")[0];
      const parts = cleanDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return parseISO(minDate);
    }
    return undefined;
  }, [minDate]);

  const parsedMaxDate = React.useMemo(() => {
    if (!maxDate) return undefined;
    if (maxDate instanceof Date) return maxDate;
    if (typeof maxDate === "string") {
      const cleanDate = maxDate.trim().split("T")[0];
      const parts = cleanDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return parseISO(maxDate);
    }
    return undefined;
  }, [maxDate]);

  // Controlled calendar month so opening a date in Sep 2026 navigates directly to September 2026
  const targetMonth = selectedDate || parsedMinDate || new Date();
  const [currentMonth, setCurrentMonth] = React.useState(targetMonth);

  React.useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    } else if (parsedMinDate) {
      setCurrentMonth(parsedMinDate);
    }
  }, [selectedDate, parsedMinDate]);

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) {
      // Synchronously set the active month to the selected date before calendar mounts
      setCurrentMonth(selectedDate || parsedMinDate || new Date());
    }
    setOpen(nextOpen);
  };

  const handleSelect = (date) => {
    if (!date) {
      onChange?.("");
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formatted = `${year}-${month}-${day}`;
      onChange?.(formatted, date);
    }
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
  };

  const isDateDisabled = (day) => {
    if (parsedMinDate) {
      const startOfMin = new Date(parsedMinDate.getFullYear(), parsedMinDate.getMonth(), parsedMinDate.getDate());
      const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      if (startOfDay < startOfMin) return true;
    }
    if (parsedMaxDate) {
      const startOfMax = new Date(parsedMaxDate.getFullYear(), parsedMaxDate.getMonth(), parsedMaxDate.getDate());
      const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      if (startOfDay > startOfMax) return true;
    }
    if (typeof disabledDates === "function") {
      return disabledDates(day);
    }
    return false;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          name={name}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "group h-9 w-full justify-between px-3 text-left font-normal border-input bg-transparent hover:bg-accent/40 text-sm shadow-2xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
            selectedDate ? "text-foreground font-medium" : "text-muted-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarIcon
              className={cn(
                "size-4 shrink-0 transition-colors",
                selectedDate ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span
              className={cn(
                "truncate",
                selectedDate ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {selectedDate ? format(selectedDate, "MMM dd, yyyy") : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1.5">
            {clearable && selectedDate && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear(e);
                  }
                }}
                className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2 shadow-2xl border border-border bg-popover text-popover-foreground rounded-xl z-50"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          disabled={isDateDisabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
