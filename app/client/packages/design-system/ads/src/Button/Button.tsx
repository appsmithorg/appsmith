import React, { forwardRef } from "react";
import clsx from "classnames";
import { useFocusRing } from "@react-aria/focus";

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

// Add this before the Button component definition
const SPINNER_ICON_PROPS = {
  className: ButtonLoadingIconClassName,
};

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

    // Replace the direct mutation of rest.onClick with this
    const handleClick =
      props.isLoading || props.isDisabled ? undefined : props.onClick;
    const buttonRef = useDOMRef(ref);
    const { focusProps, isFocusVisible } = useFocusRing();

    return (
      <StyledButton
        as={renderAs || "button"}
        {...rest}
        onClick={handleClick}
        {...focusProps}
        UNSAFE_height={UNSAFE_height}
        UNSAFE_width={UNSAFE_width}
        className={clsx(ButtonClassName, className)}
        data-disabled={props.isDisabled || false}
        data-loading={isLoading}
        disabled={props.isDisabled}
        isFocusVisible={isFocusVisible}
        isIconButton={isIconButton}
        kind={kind}
        ref={buttonRef}
        size={size}
      >
        {/* Loading section */}
        {isLoading === true && (
          <Spinner
            className={ButtonLoadingClassName}
            iconProps={SPINNER_ICON_PROPS}
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
