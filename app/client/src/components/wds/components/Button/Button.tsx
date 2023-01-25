import React, { HTMLAttributes, useMemo } from "react";

import { Spinner } from "../Spinner";
import { StyledButton } from "./index.styled";

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
} & HTMLAttributes<HTMLButtonElement>;

function Button(props: ButtonProps) {
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
      data-disabled={isDisabled || undefined}
      data-loading={isLoading || undefined}
      disabled={isDisabled || undefined}
      variant={variant}
    >
      {content}
    </StyledButton>
  );
}

export { Button };
