import React from "react";
import clsx from "classnames";

import type { BoxProps } from "./Box.types";
import { BoxClassName, PropsToBeCssPrefixPrepended } from "./Box.constants";
import { StyledBox } from "./Box.styles";
import { CSS_VARIABLE_PREFIX } from "../__config__/constants";

function Box({ children, className, ...rest }: BoxProps) {
  const transformedRest = Object.entries(rest).reduce((acc, [key, value]) => {
    const newValue = PropsToBeCssPrefixPrepended.includes(key)
      ? `var(${CSS_VARIABLE_PREFIX}${value})`
      : value;

    return {
      ...acc,
      [key]: newValue,
    };
  }, {} as BoxProps);
  return (
    <StyledBox className={clsx(BoxClassName, className)} {...transformedRest}>
      {children}
    </StyledBox>
  );
}

Box.displayName = "Box";

export { Box };
