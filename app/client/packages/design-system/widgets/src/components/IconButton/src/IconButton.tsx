import React, { forwardRef } from "react";
import type { ForwardedRef } from "react";

import { Button } from "../../Button";
import type { ButtonProps } from "../../Button";

export type IconButtonProps = Omit<ButtonProps, "iconPosition" | "children">;

const _IconButton = (
  props: IconButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  return <Button data-icon-button="" ref={ref} {...props} />;
};

export const IconButton = forwardRef(_IconButton);
