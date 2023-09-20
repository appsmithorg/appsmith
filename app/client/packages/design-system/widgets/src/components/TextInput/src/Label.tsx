import React from "react";

import { Text } from "../../Text";
import type { TextInputProps } from "./TextInput";

export type LabelProps = TextInputProps;

const _Label = (props: LabelProps) => {
  const {
    includeNecessityIndicatorInAccessibilityName,
    isRequired,
    label,
    necessityIndicator = "icon",
  } = props;
  const necessityLabel = isRequired ? "(required)" : "(optional)";
  const icon = (
    <span
      aria-label={
        includeNecessityIndicatorInAccessibilityName ? "(required)" : undefined
      }
      data-field-necessity-indicator-icon=""
    >
      *
    </span>
  );

  return (
    <Text>
      {label}
      {/* necessityLabel is hidden to screen readers if the field is required because
       * aria-required is set on the field in that case. That will already be announced,
       * so no need to duplicate it here. If optional, we do want it to be announced here. */}
      {(necessityIndicator === "label" ||
        (necessityIndicator === "icon" && isRequired)) &&
        " \u200b"}
      {necessityIndicator === "label" && (
        <span
          aria-hidden={
            !includeNecessityIndicatorInAccessibilityName
              ? isRequired
              : undefined
          }
        >
          {necessityLabel}
        </span>
      )}
      {necessityIndicator === "icon" && isRequired && icon}
    </Text>
  );
};

export const Label = _Label;
