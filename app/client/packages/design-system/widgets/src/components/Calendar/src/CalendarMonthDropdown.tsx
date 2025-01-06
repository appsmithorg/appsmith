import React from "react";
import type { Key } from "react";
import { useDateFormatter } from "@react-aria/i18n";
import { ListBoxItem, Select } from "@appsmith/wds";
import type { CalendarState } from "@react-stately/calendar";

import styles from "./styles.module.css";

export function CalendarMonthDropdown({ state }: { state: CalendarState }) {
  const months = [];
  const formatter = useDateFormatter({
    month: "long",
    timeZone: state.timeZone,
  });

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

  const onChange = (value: Key | null) => {
    const date = state.focusedDate.set({ month: Number(value) });

    state.setFocusedDate(date);
  };

  return (
    <Select
      aria-label="Month"
      className={styles.monthDropdown}
      defaultSelectedKey={state.focusedDate.month}
      onSelectionChange={onChange}
      placeholder="Select Month"
      size="small"
    >
      {months.map((month, i) => (
        <ListBoxItem id={i} key={i} textValue={month}>
          {month}
        </ListBoxItem>
      ))}
    </Select>
  );
}
