import React, { forwardRef } from "react";
import { Button } from "@design-system/widgets";

import type { ButtonGroupItemProps } from "./types";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";

const _ButtonGroupItem = (
  props: ButtonGroupItemProps,
  ref: HeadlessButtonRef,
) => {
  const { children, ...rest } = props;
  return (
    <Button ref={ref} {...rest}>
      {children}
    </Button>
  );
};

export const ButtonGroupItem = forwardRef(_ButtonGroupItem);
