import type { ForwardedRef } from "react";
import React, { forwardRef } from "react";
import { Button } from "@design-system/widgets";

import type { ButtonGroupItemProps } from "../../../";

const _ActionGroupItem = <T extends object>(
  props: ButtonGroupItemProps<T>,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  const { color, item, variant, ...rest } = props;

  return (
    <Button color={color} ref={ref} variant={variant} {...rest}>
      {item.rendered}
    </Button>
  );
};

export const ActionGroupItem = forwardRef(_ActionGroupItem);
