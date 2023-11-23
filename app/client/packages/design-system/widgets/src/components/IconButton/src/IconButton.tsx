import React, { forwardRef } from "react";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";

import { Button } from "../../Button";
import type { ButtonProps } from "../../Button";

export type IconButtonProps = Omit<ButtonProps, "iconPosition" | "children"> & {
  /** Size of the button
   * @default medium
   */
  size?: "small" | "medium" | "large";
};

const _IconButton = (props: IconButtonProps, ref: HeadlessButtonRef) => {
  const { size = "medium", ...rest } = props;

  return (
    <Button
      data-icon-button=""
      data-size={size ? size : undefined}
      ref={ref}
      {...rest}
    />
  );
};

export const IconButton = forwardRef(_IconButton);
