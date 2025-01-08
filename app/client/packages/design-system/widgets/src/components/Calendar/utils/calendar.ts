import { useDateFormatter } from "@react-aria/i18n";
import type { CalendarState } from "@react-stately/calendar";

export function useYearOptions(state: CalendarState) {
  const formatter = useDateFormatter({
    year: "numeric",
    timeZone: state.timeZone,
  });

  const years: { value: CalendarState["focusedDate"]; formatted: string }[] =
    [];

  const YEAR_RANGE = 20;

  for (let i = -YEAR_RANGE; i <= YEAR_RANGE; i++) {
    const date = state.focusedDate.add({ years: i });

    years.push({
      value: date,
      formatted: formatter.format(date.toDate(state.timeZone)),
    });
  }

  return years;
}

export function useValidMonths(
  state: CalendarState,
  formatter: Intl.DateTimeFormat,
) {
  const months = [];
  const numMonths = state.focusedDate.calendar.getMonthsInYear(
    state.focusedDate,
  );

  for (let i = 1; i <= numMonths; i++) {
    const date = state.focusedDate.set({ month: i });

    // Skip months outside valid range
    if (state.minValue && date.compare(state.minValue) < 0) {
      continue;
    }

    if (state.maxValue && date.compare(state.maxValue) > 0) {
      continue;
    }

    months.push(formatter.format(date.toDate(state.timeZone)));
  }

  return months;
}
