import React, { forwardRef } from "react";
import { Button } from "@design-system/widgets";

import type { ButtonGroupItemProps } from "./types";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";

const _ButtonGroupItem = <T extends object>(
  props: ButtonGroupItemProps<T>,
  ref: HeadlessButtonRef,
) => {
  const { color, item, variant, ...rest } = props;

  return (
    <Button color={color} ref={ref} variant={variant} {...rest}>
      {item.rendered}
    </Button>
  );
};

export const ButtonGroupItem = forwardRef(_ButtonGroupItem);
