import type { ForwardedRef } from "react";
import React, { forwardRef } from "react";
import { Button } from "@design-system/widgets";

import type { ButtonGroupButtonProps } from "./types";

const _ButtonGroupButton = <T extends object>(
  props: ButtonGroupButtonProps<T>,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  const { color, item, variant, ...rest } = props;

  return (
    <Button color={color} ref={ref} variant={variant} {...rest}>
      {item.rendered}
    </Button>
  );
};

export const ButtonGroupButton = forwardRef(_ButtonGroupButton);
