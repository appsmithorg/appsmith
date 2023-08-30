import React, { forwardRef } from "react";

import type {
  TextAreaRef as HeadlessTextAreaRef,
  TextAreaProps as HeadlessTextAreaProps,
} from "@design-system/headless";

import { Text } from "../../Text";
import { StyledTextArea } from "./index.styled";

// type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface TextAreaProps extends HeadlessTextAreaProps {
  /** loading state for the input */
  isLoading?: boolean;
  /** indicates what to use when input is required
   * @default "icon"
   */
  necessityIndicator?: "label" | "icon";
  includeNecessityIndicatorInAccessibilityName?: boolean;
}

const _TextArea = (props: TextAreaProps, ref: HeadlessTextAreaRef) => {
  const {
    description,
    errorMessage,
    includeNecessityIndicatorInAccessibilityName,
    isRequired,
    label,
    necessityIndicator = "icon",
    ...rest
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

  const wrappedLabel = label && (
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
  const wrappedDescription = description && (
    <Text variant="footnote">{description}</Text>
  );
  const wrappedErrorMessage = errorMessage && (
    <Text variant="footnote">{errorMessage}</Text>
  );

  return (
    <StyledTextArea
      description={wrappedDescription}
      errorMessage={wrappedErrorMessage}
      inputClassName="wds-body-text"
      isRequired={isRequired}
      label={wrappedLabel}
      ref={ref}
      {...rest}
    />
  );
};

export const TextArea = forwardRef(_TextArea);
