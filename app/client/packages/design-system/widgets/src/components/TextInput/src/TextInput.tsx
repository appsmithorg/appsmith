import clsx from "clsx";
import React from "react";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  newFieldStyles,
} from "@appsmith/wds";
import { TextField as AriaTextField } from "react-aria-components";

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
    <AriaTextField
      {...rest}
      className={clsx(newFieldStyles.field)}
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
    </AriaTextField>
  );
}
