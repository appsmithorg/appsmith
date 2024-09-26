import { Text, type TextProps } from "@appsmith/wds";
import React, { forwardRef, type ForwardedRef } from "react";
import { HeadingContext, useContextProps } from "react-aria-components";

function CalendarHeading(
  props: TextProps,
  ref: ForwardedRef<HTMLHeadingElement>,
) {
  [props, ref] = useContextProps(props, ref, HeadingContext);
  const { children, ...domProps } = props;

  return (
    <Text {...domProps} ref={ref}>
      {children}
    </Text>
  );
}

const _CalendarHeading = forwardRef(CalendarHeading);

export { _CalendarHeading as CalendarHeading };
