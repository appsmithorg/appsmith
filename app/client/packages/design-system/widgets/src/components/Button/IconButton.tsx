import React, { forwardRef } from "react";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";

import { Button } from "./Button";
import type { ButtonProps } from "./Button";

export type IconButtonProps = Omit<ButtonProps, "className" | "iconPosition">;

const _IconButton = (props: IconButtonProps, ref: HeadlessButtonRef) => {
  const { children, ...rest } = props;

  return <Button data-icon-button="" icon={children} ref={ref} {...rest} />;
};

export const IconButton = forwardRef(_IconButton);
