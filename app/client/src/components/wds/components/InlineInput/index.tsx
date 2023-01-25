import React from "react";

import { Input } from "../Input";
import { Container, Label, LabelWrapper } from "./index.styled";

export interface InlineInputProps
  extends React.ComponentPropsWithoutRef<"div"> {
  label: React.ReactNode;
  description: React.ReactNode;
  id: string;
  disabled?: boolean;
  error: React.ReactNode;
  labelPosition: "left" | "right";
}

export function InlineInput({
  children,
  description,
  disabled,
  error,
  id,
  label,
  labelPosition,
  ...others
}: InlineInputProps) {
  return (
    <Container {...others}>
      {children}

      <LabelWrapper labelPosition={labelPosition}>
        {label && (
          <Label className="label" data-disabled={disabled} htmlFor={id}>
            {label}
          </Label>
        )}

        {description && <Input.Description>{description}</Input.Description>}

        {error && error !== "boolean" && <span>{error}</span>}
      </LabelWrapper>
    </Container>
  );
}

InlineInput.displayName = "@appsmith/wds/inline-input";
