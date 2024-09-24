import React from "react";
import clsx from "classnames";

import { IconContainer } from "./Icon.styles";
import type { IconProps, IconSizes } from "./Icon.types";
import { IconProvider } from "./Icon.provider";
import { IconClassName } from "./Icon.constants";

export const iconSizes: Record<IconSizes, string> = {
  sm: "12px",
  md: "16px",
  lg: "24px",
};

function Icon(props: IconProps) {
  // TODO: Add a warning when an onClick is passed: "consider using a button with the isIconButton flag instead"
  const { className, color, name, size = "sm", ...rest } = props;

  return (
    <IconContainer
      className={clsx(IconClassName, className)}
      color={color}
      size={iconSizes[size]}
      {...rest}
    >
      {name ? (
        <IconProvider color={color} iconName={name} size={iconSizes[size]} />
      ) : null}
    </IconContainer>
  );
}

Icon.displayName = "Icon";

export { Icon };
