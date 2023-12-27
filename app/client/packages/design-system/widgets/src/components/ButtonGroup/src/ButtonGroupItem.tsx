import React, { forwardRef } from "react";
import { Button } from "@design-system/widgets";
import { useButtonGroupContext } from "./ButtonGroupContext";

import type { ButtonGroupItemProps } from "./types";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";

const _ButtonGroupItem = (
  props: ButtonGroupItemProps,
  ref: HeadlessButtonRef,
) => {
  const { color, variant } = useButtonGroupContext();
  const { children, ...rest } = props;
  return (
    <Button color={color} ref={ref} variant={variant} {...rest}>
      {children}
    </Button>
  );
};

export const ButtonGroupItem = forwardRef(_ButtonGroupItem);
