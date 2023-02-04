import React, { forwardRef } from "react";
import { createPolymorphicComponent } from "@mantine/utils";

import { Box } from "../Box";

export interface UnstyledButtonProps {
  children?: React.ReactNode;
}

export const _UnstyledButton = forwardRef<
  HTMLButtonElement,
  UnstyledButtonProps & { component?: any }
>((props, ref) => {
  const { component = "button", ...others } = props;
  return (
    <Box
      component={component}
      ref={ref}
      type={component === "button" ? "button" : undefined}
      {...others}
    />
  );
});

_UnstyledButton.displayName = "@appsmith/wds/UnstyledButton";

export const UnstyledButton = createPolymorphicComponent<
  "button",
  UnstyledButtonProps
>(_UnstyledButton);
