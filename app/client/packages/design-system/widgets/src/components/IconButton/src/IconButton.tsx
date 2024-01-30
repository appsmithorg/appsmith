import React, { forwardRef } from "react";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";

import { Button } from "../../Button";
import type { ButtonProps } from "../../Button";

export type IconButtonProps = Omit<ButtonProps, "iconPosition" | "children">;

const _IconButton = (props: IconButtonProps, ref: HeadlessButtonRef) => {
  return <Button data-icon-button="" ref={ref} {...props} />;
};

export const IconButton = forwardRef(_IconButton);
