import clsx from "clsx";
import React, { forwardRef, MouseEventHandler } from "react";
import { createPolymorphicComponent } from "@mantine/utils";
import { Box } from "../Box";
import { InputWrapper } from "./InputWrapper/InputWrapper";

import { InputLabel } from "./InputLabel";
import { InputError } from "./InputError";
import { InputDescription } from "./InputDescription";

import styles from "./styles.module.css";
import InputIcon from "./InputIcon";
import { Container } from "./index.styled";
import { useProvidedRefOrCreate } from "../../hooks";

export type InputVariant = "default" | "filled" | "unstyled";

export interface InputSharedProps {
  icon?: React.ReactNode;
  iconWidth?: number;
  loaderPosition?: "auto" | "leading" | "trailing";
  trailingVisual?: React.ReactNode;
  leadingVisual?: React.ReactNode;
  wrapperProps?: Record<string, any>;
  required?: boolean;
  radius?: string;
  variant?: InputVariant;
  isDisabled?: boolean;
  className?: string;
  isLoading?: boolean;
}

export interface InputProps extends InputSharedProps {
  __staticSelector?: string;
  invalid?: boolean;
  multiline?: boolean;
  pointer?: boolean;
}

export const _Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    className,
    icon,
    iconWidth,
    invalid,
    isDisabled: disabled,
    isLoading: loading,
    leadingVisual,
    loaderPosition = "auto",
    multiline,
    pointer,
    radius,
    required,
    trailingVisual,
    variant = "default",
    wrapperProps,
    ...others
  } = props;

  const showLeadingLoader =
    loading &&
    (loaderPosition === "leading" ||
      Boolean(leadingVisual && loaderPosition !== "trailing"));
  const showTrailingLoader =
    loading &&
    (loaderPosition === "trailing" ||
      Boolean(loaderPosition === "auto" && !leadingVisual));
  const inputRef = useProvidedRefOrCreate(
    ref as React.RefObject<HTMLInputElement>,
  );

  const focusInput: MouseEventHandler = () => {
    inputRef.current?.focus();
  };

  return (
    <Container
      className={className}
      variant={variant}
      {...wrapperProps}
      data-disabled={disabled || undefined}
      onClick={focusInput}
    >
      <InputIcon isLoading={showLeadingLoader} position="leading">
        {leadingVisual}
      </InputIcon>

      <Box
        component="input"
        {...others}
        aria-invalid={invalid}
        disabled={disabled}
        ref={inputRef}
        required={required}
      />

      <InputIcon isLoading={showTrailingLoader} position="trailing">
        {trailingVisual}
      </InputIcon>
    </Container>
  );
}) as any;

_Input.displayName = "@mantine/core/Input";
_Input.Wrapper = InputWrapper;
_Input.Label = InputLabel;
_Input.Error = InputError;
_Input.Description = InputDescription;

export const Input = createPolymorphicComponent<
  "input",
  InputProps,
  {
    Wrapper: typeof InputWrapper;
    Label: typeof InputLabel;
    Error: typeof InputError;
    Description: typeof InputDescription;
  }
>(_Input);
