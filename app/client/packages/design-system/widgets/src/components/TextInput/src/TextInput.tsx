import clsx from "clsx";
import React from "react";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  inputFieldStyles,
} from "@appsmith/wds";
import { TextField as HeadlessTextField } from "react-aria-components";

import type { TextInputProps } from "./types";

export function TextInput(props: TextInputProps) {
  const {
    contextualHelp,
    description,
    errorMessage,
    isDisabled,
    isInvalid,
    isLoading,
    isReadOnly,
    isRequired,
    label,
    prefix,
    size = "medium",
    suffix,
    type,
    value,
    ...rest
  } = props;

  return (
    <HeadlessTextField
      {...rest}
      className={clsx(inputFieldStyles.field)}
      data-field=""
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      value={value}
    >
      <FieldLabel
        contextualHelp={contextualHelp}
        isDisabled={isDisabled}
        isRequired={isRequired}
      >
        {label}
      </FieldLabel>
      <Input
        isLoading={isLoading}
        isReadOnly={isReadOnly}
        prefix={prefix}
        size={size}
        suffix={suffix}
        type={type}
        value={value}
      />
      {Boolean(description) && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {Boolean(errorMessage) && <FieldError>{errorMessage}</FieldError>}
    </HeadlessTextField>
  );
}
