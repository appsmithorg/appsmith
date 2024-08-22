import React from "react";

import clsx from "classnames";

import { Box } from "../Box";
import { GridClassName } from "./Grid.constants";
import type { GridProps } from "./Grid.types";

function Grid({ children, className, ...rest }: GridProps) {
  return (
    <Box className={clsx(GridClassName, className)} display={"grid"} {...rest}>
      {children}
    </Box>
  );
}

Grid.displayName = "Grid";

export { Grid };
