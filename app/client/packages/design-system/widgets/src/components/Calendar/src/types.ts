import {
  type CalendarCellProps as HeadlessCalendarCellProps,
  type CalendarHeaderCellProps as HeadlessCalendarHeaderCellProps,
} from "react-aria-components";

export type CalendarCellProps = HeadlessCalendarCellProps &
  React.RefAttributes<HTMLTableCellElement>;

export type CalendarHeaderCellProps = HeadlessCalendarHeaderCellProps &
  React.RefAttributes<HTMLTableCellElement>;
