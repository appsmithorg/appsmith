import React from "react";
import { Text } from "@appsmith/wds";
import { CalendarCell as HeadlessCalendarCell } from "react-aria-components";

import styles from "./styles.module.css";
import type { CalendarCellProps } from "./types";

function CalendarCell(props: CalendarCellProps) {
  const { date } = props;

  return (
    <HeadlessCalendarCell {...props} className={styles["calendar-cell"]}>
      <Text>{date.day}</Text>
    </HeadlessCalendarCell>
  );
}

export { CalendarCell };
