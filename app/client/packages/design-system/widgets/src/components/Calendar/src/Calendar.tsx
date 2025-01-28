import React from "react";
import type {
  DateValue,
  CalendarProps as HeadlessCalendarProps,
} from "react-aria-components";
import {
  CalendarGrid as HeadlessCalendarGrid,
  CalendarGridBody as HeadlessCalendarGridBody,
  CalendarGridHeader as HeadlessCalendarGridHeader,
  Calendar as HeadlessCalendar,
} from "react-aria-components";
import { Flex, IconButton } from "@appsmith/wds";

import styles from "./styles.module.css";
import { CalendarCell } from "./CalendarCell";
import { CalendarHeading } from "./CalendarHeading";
import { CalendarHeaderCell } from "./CalendarHeaderCell";

type CalendarProps<T extends DateValue> = HeadlessCalendarProps<T>;

export const Calendar = <T extends DateValue>(props: CalendarProps<T>) => {
  return (
    <HeadlessCalendar {...props} className={styles.calendar}>
      <Flex alignItems="center" justifyContent="space-between" width="100%">
        <IconButton icon="chevron-left" slot="previous" variant="ghost" />
        <CalendarHeading size="subtitle" />
        <IconButton icon="chevron-right" slot="next" variant="ghost" />
      </Flex>
      <HeadlessCalendarGrid>
        <HeadlessCalendarGridHeader>
          {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
        </HeadlessCalendarGridHeader>
        <HeadlessCalendarGridBody>
          {(date) => <CalendarCell date={date} />}
        </HeadlessCalendarGridBody>
      </HeadlessCalendarGrid>
    </HeadlessCalendar>
  );
};
