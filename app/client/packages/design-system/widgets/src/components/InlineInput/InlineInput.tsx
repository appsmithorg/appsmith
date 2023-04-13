import React from "react";
import { Text } from "../Text";
import { StyledInlineInput, StyledLabel } from "./index.styled";

export interface InlineInputProps
  extends React.ComponentPropsWithoutRef<"div"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  id: string;
  isDisabled?: boolean;
  error?: React.ReactNode;
  labelPosition?: "left" | "right";
  labelAlignment?: "left" | "right";
}

export function InlineInput(props: InlineInputProps) {
  const {
    children,
    description,
    error,
    id,
    isDisabled: disabled,
    label,
    ...rest
  } = props;

  return (
    <StyledInlineInput {...rest}>
      {children}

      <div className="label-wrapper">
        {label && (
          <StyledLabel className="label" data-disabled={disabled} htmlFor={id}>
            <Text> {label}</Text>
          </StyledLabel>
        )}
        {description && <span className="description">{description}</span>}
        {error && error !== "boolean" && <span className="error">{error}</span>}
      </div>
    </StyledInlineInput>
  );
}
