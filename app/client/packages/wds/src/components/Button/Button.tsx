import React, { HTMLAttributes, useMemo, forwardRef } from "react";

import { Spinner } from "../Spinner";
import { StyledButton } from "./index.styled";

// types
export const BUTTON_VARIANTS = [
  "filled",
  "outline",
  "light",
  "subtle",
  "input",
] as const;

export type ButtonVariant = typeof BUTTON_VARIANTS[number];

export type ButtonProps = {
  accentColor?: string;
  variant?: ButtonVariant;
  boxShadow?: string;
  borderRadius?: string;
  tooltip?: string;
  children?: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
} & HTMLAttributes<HTMLButtonElement>;

// component
const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    children,
    isDisabled,
    isLoading,
    leadingIcon,
    trailingIcon,
    variant = "filled",
    ...rest
  } = props;

  const content = useMemo(() => {
    if (isLoading) return <Spinner />;

    return (
      <>
        {leadingIcon && <span data-component="leadingIcon">{leadingIcon}</span>}
        {children && <span data-component="text">{children}</span>}
        {trailingIcon && (
          <span data-component="trailingIcon">{trailingIcon}</span>
        )}
      </>
    );
  }, [isLoading, children, trailingIcon, leadingIcon]);

  return (
    <StyledButton
      {...rest}
      data-button
      data-disabled={isDisabled || undefined}
      data-loading={isLoading || undefined}
      data-variant={variant}
      disabled={isDisabled || undefined}
      ref={ref}
      variant={variant}
    >
      {content}
    </StyledButton>
  );
}) as typeof StyledButton;

Button.displayName = "Button";

export { Button };
