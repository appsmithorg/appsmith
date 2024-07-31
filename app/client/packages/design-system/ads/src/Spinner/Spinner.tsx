import React from "react";
import clsx from "classnames";

import type { SpinnerProps } from "./Spinner.types";
import { StyledSpinner } from "./Spinner.styles";
import { Icon } from "../Icon";
import { SpinnerClassName, SpinnerIconClassName } from "./Spinner.constants";

function Spinner(props: SpinnerProps) {
  const { className, iconProps, size: spinnerSize = "sm", ...rest } = props;
  const classes = clsx(SpinnerClassName, className);
  const iconClasses = clsx(
    SpinnerIconClassName,
    iconProps && iconProps.className,
  );

  return (
    <StyledSpinner {...rest} className={classes}>
      <Icon
        {...iconProps}
        className={iconClasses}
        name="loader-line"
        size={spinnerSize} // IconProps of size will be ignored by the spinner
      />
    </StyledSpinner>
  );
}

Spinner.displayName = "Spinner";

Spinner.defaultProps = {};

export { Spinner };
