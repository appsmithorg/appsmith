import clsx from "clsx";
import React, { forwardRef } from "react";
import type {
  TextAreaRef as HeadlessTextAreaRef,
  TextAreaProps as HeadlessTextAreaProps,
} from "@design-system/headless";
import { TextArea as HeadlessTextArea } from "@design-system/headless";

import { Text } from "../../Text";
import { Label } from "../../TextInput";
import textAreaStyles from "./styles.module.css";
import { textInputStyles, fieldStyles } from "../../../styles";

export interface TextAreaProps extends HeadlessTextAreaProps {
  /** loading state for the input */
  isLoading?: boolean;
  /** indicates what to use when input is required
   * @default "icon"
   */
  necessityIndicator?: "label" | "icon";
  includeNecessityIndicatorInAccessibilityName?: boolean;
  /** label for the input */
  label?: string;
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

  const wrappedLabel = label && (
    <Label
      includeNecessityIndicatorInAccessibilityName={
        includeNecessityIndicatorInAccessibilityName
      }
      isRequired={isRequired}
      label={label}
      necessityIndicator={necessityIndicator}
    />
  );

  const wrappedDescription = description && (
    <Text variant="footnote">{description}</Text>
  );
  const wrappedErrorMessage = errorMessage && (
    <Text variant="footnote">{errorMessage}</Text>
  );

  return (
    <HeadlessTextArea
      className={clsx(
        textInputStyles["text-input"],
        fieldStyles.field,
        textAreaStyles["textarea"],
      )}
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
