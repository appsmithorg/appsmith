import React, { forwardRef } from "react";
import clsx from "classnames";

import type { FlexProps } from "./Flex.types";
import { FlexClassName } from "./Flex.constants";
import { Box } from "../Box";

const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ children, className, ...rest }, ref) => {
    return (
      <Box
        className={clsx(FlexClassName, className)}
        display={"flex"}
        ref={ref}
        {...rest}
      >
        {children}
      </Box>
    );
  },
);

Flex.displayName = "Flex";

export { Flex };
