import clsx from "clsx";
import React from "react";
import { FieldError, FieldLabel, Input, inputFieldStyles } from "@appsmith/wds";
import { TextField as HeadlessTextField } from "react-aria-components";

import type { TextFieldProps } from "./types";

export function TextField(props: TextFieldProps) {
  const {
    contextualHelp,
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
      <FieldError>{errorMessage}</FieldError>
    </HeadlessTextField>
  );
}
