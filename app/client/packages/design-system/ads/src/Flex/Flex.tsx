import React from "react";
import clsx from "classnames";

import type { FlexProps } from "./Flex.types";
import { FlexClassName } from "./Flex.constants";
import { Box } from "../Box";

function Flex({ children, className, ...rest }: FlexProps) {
  return (
    <Box className={clsx(FlexClassName, className)} display={"flex"} {...rest}>
      {children}
    </Box>
  );
}

Flex.displayName = "Flex";

export { Flex };
