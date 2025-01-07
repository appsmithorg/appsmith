import React from "react";
import type { Key } from "react";
import { useDateFormatter } from "@react-aria/i18n";
import { ListBoxItem, Select } from "@appsmith/wds";
import type { CalendarState } from "@react-stately/calendar";

import styles from "./styles.module.css";
import { useValidMonths } from "../utils/calendar";

export function CalendarMonthDropdown({ state }: { state: CalendarState }) {
  const formatter = useDateFormatter({
    month: "long",
    timeZone: state.timeZone,
  });

  const months = useValidMonths(state, formatter);

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
