import React, { forwardRef, useState } from "react";

import type {
  TextInputRef as HeadlessTextInputRef,
  TextInputProps as HeadlessTextInputProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { Spinner } from "../Spinner";
import { StyledTextInput } from "./index.styled";
import { IconButton } from "../Button";
import { EyeOffIcon } from "./icons/EyeOffIcon";
import { EyeIcon } from "./icons/EyeIcon";

const ICON_SIZE = 16;

export interface TextInputProps extends HeadlessTextInputProps {
  /** position for the laoding icon */
  loaderPosition?: "auto" | "start" | "end";
  /** loading state for the input */
  isLoading?: boolean;
  /** indicates what to use when input is required
   * @default "icon"
   */
  necessityIndicator?: "label" | "icon";
  includeNecessityIndicatorInAccessibilityName?: boolean;
}

const _TextInput = (props: TextInputProps, ref: HeadlessTextInputRef) => {
  const {
    description,
    endIcon,
    errorMessage,
    includeNecessityIndicatorInAccessibilityName,
    isRequired,
    label,
    loaderPosition = "auto",
    necessityIndicator = "icon",
    startIcon,
    type,
    ...rest
  } = props;
  const [showPassword, togglePassword] = useState(false);
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

  const onPressEyeIcon = () => {
    togglePassword((prev) => !prev);
  };

  const renderStartIcon = () => {
    const showLoadingIndicator =
      props.isLoading &&
      (loaderPosition === "start" ||
        Boolean(startIcon && loaderPosition !== "end"));

    if (!showLoadingIndicator) return startIcon;

    return <Spinner />;
  };

  const renderEndIcon = () => {
    if (type === "password") {
      const Icon = showPassword ? EyeOffIcon : EyeIcon;

      return (
        <IconButton color="neutral" onPress={onPressEyeIcon} variant="ghost">
          <Icon size={ICON_SIZE} />
        </IconButton>
      );
    }

    const showLoadingIndicator =
      props.isLoading &&
      (loaderPosition === "end" ||
        Boolean(loaderPosition === "auto" && !startIcon));

    if (!showLoadingIndicator) return endIcon;

    return <Spinner />;
  };

  return (
    <StyledTextInput
      description={wrappedDescription}
      endIcon={renderEndIcon()}
      errorMessage={wrappedErrorMessage}
      inputClassName="wds-body-text"
      isRequired={isRequired}
      label={wrappedLabel}
      ref={ref}
      startIcon={renderStartIcon()}
      type={showPassword ? "text" : type}
      {...rest}
    />
  );
};

export const TextInput = forwardRef(_TextInput);
