import type {
  TextInputRef as HeadlessTextInputRef,
  TextInputProps as HeadlessTextInputProps,
} from "@design-system/headless";
import React, { forwardRef, useState } from "react";

import { Label } from "./Label";
import { Text } from "../../Text";
import { Spinner } from "../../Spinner";
import { EyeIcon } from "./icons/EyeIcon";
import { IconButton } from "../../IconButton";
import { EyeOffIcon } from "./icons/EyeOffIcon";
import { StyledTextInput } from "./index.styled";
import { ContextualHelp } from "./ContextualHelp";
import { getTypographyClassName } from "@design-system/theming";

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
  /** adds as span for accesiblity for necessity indicator */
  includeNecessityIndicatorInAccessibilityName?: boolean;
  /** label for the input */
  label?: string;
}

const _TextInput = (props: TextInputProps, ref: HeadlessTextInputRef) => {
  const {
    contextualHelp: contextualHelpProp,
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

  const contextualHelp = label && contextualHelpProp && (
    <ContextualHelp contextualHelp={contextualHelpProp} />
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
      contextualHelp={contextualHelp}
      description={wrappedDescription}
      endIcon={renderEndIcon()}
      errorMessage={wrappedErrorMessage}
      inputClassName={getTypographyClassName("body")}
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
