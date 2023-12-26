import React, { forwardRef } from "react";
import { Button } from "@design-system/widgets";

import type { ActionGroupItemProps } from "./types";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";

const _ActionGroupItem = <T extends object>(
  props: ActionGroupItemProps<T>,
  ref: HeadlessButtonRef,
) => {
  const { color, item, variant, ...rest } = props;

  return (
    <Button color={color} ref={ref} variant={variant} {...rest}>
      {item.rendered}
    </Button>
  );
};

export const ActionGroupItem = forwardRef(_ActionGroupItem);
