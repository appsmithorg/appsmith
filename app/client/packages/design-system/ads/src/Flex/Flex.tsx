import React from "react";

import clsx from "classnames";

import { Box } from "../Box";
import { FlexClassName } from "./Flex.constants";
import type { FlexProps } from "./Flex.types";

function Flex({ children, className, ...rest }: FlexProps) {
  return (
    <Box className={clsx(FlexClassName, className)} display={"flex"} {...rest}>
      {children}
    </Box>
  );
}

Flex.displayName = "Flex";

export { Flex };
