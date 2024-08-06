import type { InputProps } from "../Input";
import type {
  ReactDatePickerProps,
  ReactDatePickerCustomHeaderProps,
} from "react-datepicker";

import type { Sizes } from "../__config__/types";
import type React from "react";

interface CommonProps {
  /** The class name to apply to the button component. */
  className?: string;
  /** Size of the input field */
  inputSize?: Extract<Sizes, "sm" | "md">;
  /** The start year to display in the header list. */
  yearStartRange?: number;
  /** The end year to display in the header list. */
  yearEndRange?: number;
  /** Whether to allow same day range selection. */
  allowSameDay?: boolean | undefined;
  /** Whether to close the calender on scroll.  */
  closeOnScroll?: boolean | ((e: Event) => boolean) | undefined;
  /** Date format */
  dateFormat?: string | string[] | undefined;
  /** Whether the date picker is disabled or not. */
  isDisabled?: boolean | undefined;
  /** Default end date of date range picker. */
  endDate?: Date | null | undefined;
  /** Dates to be excluded. */
  excludeDates?: Date[] | undefined;
  /** Date intervals to be excluded. */
  excludeDateIntervals?: Array<{ start: Date; end: Date }> | undefined;
  /** Times to be excluded. */
  excludeTimes?: Date[] | undefined;
  /** Function to filter dates. */
  filterDate?(date: Date): boolean;
  /** Function to filter time. */
  filterTime?(date: Date): boolean;
  /** Whether the field is clearable or not. */
  isClearable?: boolean | undefined;
  /** input props */
  inputProps?: InputProps;
  /** Locale which time should be shown. */
  locale?: string | Locale | undefined;
  /** Label to be shown. */
  label?: string | undefined;
  /** max date */
  maxDate?: Date | null | undefined;
  /** max time */
  maxTime?: Date | undefined;
  /** min date */
  minDate?: Date | null | undefined;
  /** min time */
  minTime?: Date | undefined;
  /** onBlur event. */
  onBlur?(event: React.FocusEvent<HTMLInputElement>): void;
  /** Event for calender close. */
  onCalendarClose?(): void;
  /** Event for calender open. */
  onCalendarOpen?(): void;
  /** Event for clicking outside the calender. */
  onClickOutside?(event: React.MouseEvent<HTMLDivElement>): void;
  /** Whether the datepicker is open or not. */
  open?: boolean | undefined;
  /** Placeholder text */
  placeholderText?: string | undefined;
  /** Whether the date picker is read only or not. */
  isReadOnly?: boolean | undefined;
  /** Whether the date picker is required or not. */
  isRequired?: boolean | undefined;
  /** Selected date. */
  selected?: Date | null | undefined;
  /** Whether the calender should close on selection. */
  shouldCloseOnSelect?: boolean | undefined;
  /** Default start date of date range picker. */
  startDate?: Date | null | undefined;
  /** Time format. */
  timeFormat?: string | undefined;
}
export type DatePickerProps = Omit<ReactDatePickerProps, "selectsRange"> &
  CommonProps;

export type DateRangePickerProps = ReactDatePickerProps &
  CommonProps & {
    onChange: (
      dates: [Date | null, Date | null],
      e: React.SyntheticEvent<any, Event> | undefined,
    ) => void;
  };

export type DatePickerHeaderProps = {
  /** The class name to apply to the button component. */
  className?: string;
  /** The start year to display in the header list. */
  startYear?: number;
  /** The end year to display in the header list. */
  endYear?: number;
  /** Whether the component is date picker or date range picker. */
  dateRangePicker: boolean;
} & ReactDatePickerCustomHeaderProps;

export interface DateRangeShortcutsConfig {
  showRangeShortcuts?: boolean;
  allowSameDay?: boolean;
  hasTimePrecision?: boolean;
  useSingleDateShortcuts?: boolean;
  excludeShortcuts?: ExcludeShortcuts[];
}

export type ExcludeShortcuts =
  | "today"
  | "yesterday"
  | "past_2_years"
  | "past_year"
  | "past_6_months"
  | "past_3_months"
  | "past_month"
  | "past_week";

export type DateRange = [Date | null, Date | null];
export interface DateRangeShortcut {
  label: string;
  dateRange: DateRange;
}
export interface DateRangeShortcutsProps extends DateRangeShortcutsConfig {
  currentDates: DateRange;
  onChangeHandler: (
    date: [Date | null, Date | null],
    e: React.SyntheticEvent<any, Event> | undefined,
    type?: string,
  ) => void;
}
