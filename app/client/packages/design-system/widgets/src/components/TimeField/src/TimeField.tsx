import clsx from "clsx";
import React from "react";
import {
  FieldError,
  FieldLabel,
  inputFieldStyles,
  textInputStyles,
  dateTimeInputStyles,
} from "@appsmith/wds";
import {
  DateInput,
  DateSegment,
  Group,
  TimeField as HeadlessTimeField,
  type TimeValue,
} from "react-aria-components";
import { getTypographyClassName } from "@appsmith/wds-theming";

import type { TimeFieldProps } from "./types";

export function TimeField<T extends TimeValue>(props: TimeFieldProps<T>) {
  const {
    contextualHelp,
    errorMessage,
    isDisabled,
    isInvalid,
    isReadOnly,
    isRequired,
    label,
    prefix,
    size = "medium",
    suffix,
    value,
    ...rest
  } = props;

  return (
    <HeadlessTimeField
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
      <Group className={textInputStyles.inputGroup}>
        <DateInput
          className={clsx(
            textInputStyles.input,
            dateTimeInputStyles.input,
            getTypographyClassName("body"),
          )}
          data-date-input
          data-size={Boolean(size) ? size : undefined}
        >
          {(segment) => <DateSegment segment={segment} />}
        </DateInput>
        {Boolean(prefix) && <span data-input-prefix>{prefix}</span>}
        {Boolean(suffix) && <span data-input-suffix>{suffix}</span>}
      </Group>
      <FieldError>{errorMessage}</FieldError>
    </HeadlessTimeField>
  );
}
