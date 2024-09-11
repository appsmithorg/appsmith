import React, { forwardRef } from "react";
import clsx from "classnames";

import { StyledButton, ButtonContent } from "./Button.styles";
import type { ButtonProps } from "./Button.types";
import { useDOMRef } from "../__hooks__/useDomRef";
import { Icon } from "../Icon";
import {
  ButtonClassName,
  ButtonLoadingClassName,
  ButtonLoadingIconClassName,
  ButtonContentClassName,
  ButtonContentChildrenClassName,
  ButtonContentIconStartClassName,
  ButtonContentIconEndClassName,
} from "./Button.constants";
import { Spinner } from "../Spinner";

/**
 * TODO:
 * - if both left and right icon is used, disregard left icon and print a warning in the console.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref): JSX.Element => {
    const {
      children,
      className,
      endIcon,
      isIconButton,
      isLoading,
      kind,
      renderAs,
      size,
      startIcon,
      UNSAFE_height,
      UNSAFE_width,
      ...rest
    } = props;
    // disable button when loading
    rest.onClick =
      props.isLoading || props.isDisabled ? undefined : props.onClick;
    const buttonRef = useDOMRef(ref);
    return (
      <StyledButton
        as={renderAs || "button"}
        {...rest}
        UNSAFE_height={UNSAFE_height}
        UNSAFE_width={UNSAFE_width}
        className={clsx(ButtonClassName, className)}
        data-disabled={props.isDisabled || false}
        data-loading={isLoading}
        disabled={props.isDisabled}
        isIconButton={isIconButton}
        kind={kind}
        ref={buttonRef}
        size={size}
      >
        {/* Loading section */}
        {isLoading === true && (
          <Spinner
            className={ButtonLoadingClassName}
            iconProps={{
              className: ButtonLoadingIconClassName,
            }}
            size="md"
          />
        )}

        {/* Button content */}
        <ButtonContent
          className={ButtonContentClassName}
          isIconButton={isIconButton}
          size={size}
        >
          {/* Start Icon Section */}
          {startIcon ? (
            <Icon
              className={ButtonContentIconStartClassName}
              name={startIcon}
              size="md"
            />
          ) : null}

          {/* Children section */}
          {children && (
            <span className={ButtonContentChildrenClassName}>{children}</span>
          )}

          {/* End Icon Section */}
          {endIcon ? (
            <Icon
              className={ButtonContentIconEndClassName}
              name={endIcon}
              size="md"
            />
          ) : null}
        </ButtonContent>
      </StyledButton>
    );
  },
);

Button.displayName = "Button";

Button.defaultProps = {
  size: "sm",
  kind: "primary",
  isLoading: false,
  isDisabled: false,
  type: "button",
};

export { Button };
