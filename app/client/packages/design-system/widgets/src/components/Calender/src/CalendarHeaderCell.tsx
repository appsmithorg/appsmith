import React from "react";
import { Text } from "@appsmith/wds";
import { CalendarHeaderCell as HeadlessCalendarHeaderCell } from "react-aria-components";

import type { CalendarHeaderCellProps } from "./types";

function CalendarHeaderCell(props: CalendarHeaderCellProps) {
  const { children } = props;

  return (
    <HeadlessCalendarHeaderCell {...props}>
      <Text color="neutral" fontWeight={700} textAlign="center">
        {children}
      </Text>
    </HeadlessCalendarHeaderCell>
  );
}

export { CalendarHeaderCell };
