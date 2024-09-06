import React from "react";
import clsx from "classnames";

import type { GridProps } from "./Grid.types";
import { GridClassName } from "./Grid.constants";
import { Box } from "../Box";

function Grid({ children, className, ...rest }: GridProps) {
  return (
    <Box className={clsx(GridClassName, className)} display={"grid"} {...rest}>
      {children}
    </Box>
  );
}

Grid.displayName = "Grid";

export { Grid };
