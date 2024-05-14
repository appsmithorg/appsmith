import React, { forwardRef } from "react";
import { Button } from "@design-system/widgets";
import type { ForwardedRef } from "react";
import type { ActionGroupButtonProps } from "@design-system/widgets";

const _ActionGroupButton = <T extends object>(
  props: ActionGroupButtonProps<T>,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  const { color, item, variant, ...rest } = props;

  return (
    <Button color={color} ref={ref} variant={variant} {...rest}>
      {item.rendered}
    </Button>
  );
};

export const ActionGroupButton = forwardRef(_ActionGroupButton);
