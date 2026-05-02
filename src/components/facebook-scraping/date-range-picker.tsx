"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Format date untuk input HTML5 (YYYY-MM-DD)
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  // Parse date dari input HTML5
  const parseDateFromInput = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  // Handler untuk perubahan tanggal from
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = parseDateFromInput(e.target.value);
    onDateRangeChange({
      from: newFrom,
      to: dateRange.to,
    });
  };

  // Handler untuk perubahan tanggal to
  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = parseDateFromInput(e.target.value);
    onDateRangeChange({
      from: dateRange.from,
      to: newTo,
    });
  };

  // Handler untuk reset
  const handleReset = () => {
    onDateRangeChange({ from: undefined, to: undefined });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-start gap-2 text-xs font-normal",
            !dateRange.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                {format(dateRange.to, "dd MMM yyyy", { locale: id })}
              </>
            ) : (
              format(dateRange.from, "dd MMM yyyy", { locale: id })
            )
          ) : (
            <span>Pilih Tanggal</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Pilih Range Tanggal</h4>
            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Input From Date */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Dari Tanggal
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={formatDateForInput(dateRange.from)}
                onChange={handleFromChange}
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>
          </div>

          {/* Input To Date */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Sampai Tanggal
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={formatDateForInput(dateRange.to)}
                onChange={handleToChange}
                min={formatDateForInput(dateRange.from)}
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>
          </div>

          {/* Info */}
          {(dateRange.from || dateRange.to) && (
            <div className="rounded-lg border border-border bg-muted/50 p-2 text-xs">
              <div className="font-medium text-muted-foreground mb-1">
                Range Dipilih:
              </div>
              <div className="text-foreground">
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                    </>
                  ) : (
                    <>
                      {format(dateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                      <span className="text-muted-foreground">Belum dipilih</span>
                    </>
                  )
                ) : (
                  <span className="text-muted-foreground">Belum dipilih</span>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
