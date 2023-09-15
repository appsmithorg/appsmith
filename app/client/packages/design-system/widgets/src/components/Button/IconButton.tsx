import React, { forwardRef } from "react";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";

import { Button } from "./Button";
import type { ButtonProps } from "./Button";

<<<<<<< HEAD:app/client/packages/design-system/widgets/src/components/Button/IconButton.tsx
export type IconButtonProps = Omit<ButtonProps, "className" | "iconPosition">;
=======
export type IconButtonProps = Omit<ButtonProps, "iconPosition" | "icon"> & {
  size?: "small" | "medium" | "large";
};
>>>>>>> a2cb859cb3 (code review coments fixes):app/client/packages/design-system/widgets/src/components/IconButton/src/IconButton.tsx

const _IconButton = (props: IconButtonProps, ref: HeadlessButtonRef) => {
  const { children, size, ...rest } = props;

  return (
    <Button
      data-icon-button=""
      data-size={size ? size : undefined}
      icon={children}
      ref={ref}
      {...rest}
    />
  );
};

export const IconButton = forwardRef(_IconButton);
