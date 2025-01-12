import { type TextProps } from "@appsmith/wds";
import {
  CalendarStateContext,
  HeadingContext,
  useContextProps,
} from "react-aria-components";
import React, { forwardRef, useContext, type ForwardedRef } from "react";

import styles from "./styles.module.css";
import { CalendarMonthDropdown } from "./CalendarMonthDropdown";
import { CalendarYearDropdown } from "./CalendarYearDropdown";

function CalendarHeading(
  props: TextProps,
  ref: ForwardedRef<HTMLHeadingElement>,
) {
  [props, ref] = useContextProps(props, ref, HeadingContext);
  const state = useContext(CalendarStateContext);

  return (
    <div className={styles.monthYearDropdown}>
      <CalendarMonthDropdown state={state} />
      <CalendarYearDropdown state={state} />
    </div>
  );
}

const _CalendarHeading = forwardRef(CalendarHeading);

export { _CalendarHeading as CalendarHeading };
