import type { HTMLAttributes } from "react";
import React, { useMemo, forwardRef } from "react";

import { Text } from "../Text";
import { Spinner } from "../Spinner";
import { StyledButton } from "./index.styled";
import type { fontFamilyTypes } from "../../utils/typography";

// types
export enum ButtonVariant {
  FILLED = "filled",
  OUTLINE = "outline",
  LIGHT = "light",
  SUBTLE = "subtle",
}

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
  fontFamily?: fontFamilyTypes;
} & HTMLAttributes<HTMLButtonElement>;

// component
const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    children,
    fontFamily,
    isDisabled,
    isLoading,
    leadingIcon,
    trailingIcon,
    variant = ButtonVariant.FILLED,
    ...rest
  } = props;

  const content = useMemo(() => {
    if (isLoading) return <Spinner />;

    return (
      <>
        {leadingIcon && <span data-component="leadingIcon">{leadingIcon}</span>}
        {children && (
          <Text data-component="text" fontFamily={fontFamily}>
            {children}
          </Text>
        )}
        {trailingIcon && (
          <span data-component="trailingIcon">{trailingIcon}</span>
        )}
      </>
    );
  }, [isLoading, children, trailingIcon, leadingIcon, fontFamily]);

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
