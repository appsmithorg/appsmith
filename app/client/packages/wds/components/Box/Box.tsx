import React, { forwardRef } from "react";
import { createPolymorphicComponent } from "@mantine/utils";

export interface BoxProps extends Record<string, any> {
  children?: React.ReactNode;
}

export const _Box = forwardRef<HTMLDivElement, BoxProps & { component: any }>(
  ({ component, ...others }, ref) => {
    const Element = component || "div";
    return <Element ref={ref} {...others} />;
  },
);

// _Box.displayName = "@mantine/core/Box";

export const Box = createPolymorphicComponent<"div", BoxProps>(_Box);
