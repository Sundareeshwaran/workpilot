"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-popover p-3 text-popover-foreground select-none",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 z-10",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-7 w-7 p-0 border border-border bg-background text-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground select-none cursor-pointer",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-7 w-7 p-0 border border-border bg-background text-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground select-none cursor-pointer",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-7 w-full items-center justify-center px-8",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-7 w-full items-center justify-center gap-1.5 text-sm font-semibold text-foreground",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn("relative rounded-md", defaultClassNames.dropdown_root),
        dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
        caption_label: cn("font-bold select-none text-sm text-foreground tracking-tight", defaultClassNames.caption_label),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex justify-between border-b border-border/70 pb-1.5 mb-1", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-center text-[0.72rem] font-bold text-muted-foreground uppercase select-none tracking-wider",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full justify-between gap-1", defaultClassNames.week),
        week_number_header: cn("w-8 select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-8 w-8 rounded-md p-0 text-center select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-md bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-md bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-md font-bold text-primary border border-primary/60 bg-primary/10",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/40",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground/50 line-through cursor-not-allowed pointer-events-none",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (<div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />);
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (<ChevronLeftIcon className={cn("h-4 w-4", className)} {...props} />);
          }

          if (orientation === "right") {
            return (<ChevronRightIcon className={cn("h-4 w-4", className)} {...props} />);
          }

          return (<ChevronDownIcon className={cn("h-4 w-4", className)} {...props} />);
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div
                className="flex h-8 w-8 items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props} />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelected = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;
  const isToday = modifiers.today;
  const isDisabled = modifiers.disabled;
  const isOutside = modifiers.outside;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      disabled={isDisabled}
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={isSelected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex h-8 w-8 p-0 text-xs font-medium transition-all rounded-md cursor-pointer",
        // Default active day inside month
        "text-foreground hover:bg-primary/15 hover:text-primary",
        // Outside day
        isOutside && "text-muted-foreground/40 hover:text-muted-foreground/70",
        // Today (not selected)
        isToday && !isSelected && "border border-primary/60 text-primary bg-primary/10 font-bold",
        // Single selected date
        isSelected && "bg-primary text-white font-bold shadow-sm hover:bg-primary hover:text-white ring-2 ring-primary/30",
        // Disabled day (clearly readable numbers with strikethrough)
        isDisabled && "text-muted-foreground/50 line-through cursor-not-allowed pointer-events-none hover:bg-transparent hover:text-muted-foreground/50",
        defaultClassNames.day,
        className
      )}
      {...props} />
  );
}

export { Calendar, CalendarDayButton }
