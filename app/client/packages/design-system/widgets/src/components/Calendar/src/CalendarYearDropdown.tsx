import React from "react";
import type { Key } from "react";
import { ListBoxItem, Select } from "@appsmith/wds";
import type { CalendarState } from "@react-stately/calendar";

import { useYearOptions } from "../utils/calendar";

export function CalendarYearDropdown({ state }: { state: CalendarState }) {
  const years = useYearOptions(state);

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
