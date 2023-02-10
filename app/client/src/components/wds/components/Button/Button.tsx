import React, { HTMLAttributes, useMemo, forwardRef } from "react";

import { Text } from "../Text";
import { Spinner } from "../Spinner";
import { StyledButton } from "./index.styled";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 * ----------------------------------------------------------------------------
 */
export type ButtonProps = {
  accentColor?: string;
  variant?: "filled" | "outline" | "link" | "subtle" | "white" | "light";
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

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 *-----------------------------------------------------------------------------
 */
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
        {children && (
          <span data-component="text">
            <Text>{children}</Text>
          </span>
        )}
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

export { Button };
