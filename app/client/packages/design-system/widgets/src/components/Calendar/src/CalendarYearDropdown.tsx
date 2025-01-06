import { ListBoxItem, Select } from "@appsmith/wds";
import { useDateFormatter } from "@react-aria/i18n";
import type { CalendarState } from "@react-stately/calendar";
import React from "react";
import type { Key } from "react";

export function CalendarYearDropdown({ state }: { state: CalendarState }) {
  const years: { value: CalendarState["focusedDate"]; formatted: string }[] =
    [];
  const formatter = useDateFormatter({
    year: "numeric",
    timeZone: state.timeZone,
  });

  for (let i = -20; i <= 20; i++) {
    const date = state.focusedDate.add({ years: i });

    years.push({
      value: date,
      formatted: formatter.format(date.toDate(state.timeZone)),
    });
  }

  const onChange = (value: Key | null) => {
    const index = Number(value);
    const date = years[index].value;

    state.setFocusedDate(date);
  };

  return (
    <Select
      aria-label="Year"
      onSelectionChange={onChange}
      placeholder="Select Year"
      selectedKey={20}
      size="small"
    >
      {years.map((year, i) => (
        <ListBoxItem id={i} key={i} textValue={year.formatted}>
          {year.formatted}
        </ListBoxItem>
      ))}
    </Select>
  );
}
