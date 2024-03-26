import clsx from "clsx";
import type {
  TextInputRef as HeadlessTextInputRef,
  TextInputProps as HeadlessTextInputProps,
} from "@design-system/headless";
import React, { forwardRef, useState } from "react";
import { getTypographyClassName } from "@design-system/theming";
import { TextInput as HeadlessTextInput } from "@design-system/headless";

import { Spinner } from "../../Spinner";
import type { IconProps } from "../../Icon";
import { IconButton } from "../../IconButton";
import { ContextualHelp } from "./ContextualHelp";
import { textInputStyles, fieldStyles } from "../../../styles";
import type { SIZES } from "../../../shared";

export interface TextInputProps extends HeadlessTextInputProps {
  /** position for the laoding icon */
  loaderPosition?: "auto" | "start" | "end";
  /** loading state for the input */
  isLoading?: boolean;
  /** size of the input
   *
   * @default medium
   */
  size?: Omit<keyof typeof SIZES, "large">;
}

const _TextInput = (props: TextInputProps, ref: HeadlessTextInputRef) => {
  const {
    contextualHelp: contextualHelpProp,
    description,
    endIcon,
    errorMessage,
    isLoading = false,
    isRequired,
    label,
    loaderPosition = "auto",
    size = "medium",
    startIcon,
    type,
    ...rest
  } = props;
  const [showPassword, togglePassword] = useState(false);

  const contextualHelp = Boolean(contextualHelpProp) && (
    <ContextualHelp contextualHelp={contextualHelpProp} />
  );

  const onPressEyeIcon = () => {
    togglePassword((prev) => !prev);
  };

  // we show loading indicator on left when isLoading is true and if:
  // 1. loaderPosition is "start"
  // 2. or loaderPosition is "auto" and endIcon is not present but startIcon is present
  // 3. or loaderPosition is "auto" and endIcon is present and startIcon is also present
  const renderStartIcon = () => {
    const showLoadingIndicator =
      isLoading &&
      (loaderPosition === "start" ||
        (Boolean(startIcon) && !Boolean(endIcon) && loaderPosition === "auto"));

    if (showLoadingIndicator) return <Spinner />;

    return startIcon;
  };

  const renderEndIcon = () => {
    if (type === "password") {
      const icon: IconProps["name"] = showPassword ? "eye-off" : "eye";

      return (
        <IconButton
          color="neutral"
          icon={icon}
          onPress={onPressEyeIcon}
          variant="ghost"
        />
      );
    }

    // we show loading indicator on left when isLoading is true and if:
    // 1. loaderPosition is "end"
    // 2. or loaderPosition is "auto" and endIcon is not present and also startIcon is not present
    // 3. or loaderPosition is "auto" and endIcon is is present and startIcon is not present
    // 4. or loaderPosition is "auto" and endIcon is present and startIcon is also present
    const showLoadingIndicator =
      (isLoading &&
        (loaderPosition === "end" ||
          (Boolean(loaderPosition === "auto" && !Boolean(endIcon)) &&
            !Boolean(startIcon)))) ||
      (loaderPosition === "auto" && Boolean(endIcon) && !Boolean(startIcon)) ||
      (loaderPosition === "auto" && Boolean(endIcon) && Boolean(startIcon));

    if (showLoadingIndicator) return <Spinner />;

    return endIcon;
  };

  return (
    <HeadlessTextInput
      contextualHelp={contextualHelp}
      data-size={Boolean(size) ? size : undefined}
      description={description}
      endIcon={renderEndIcon()}
      errorMessage={errorMessage}
      fieldClassName={clsx(textInputStyles["text-input"], fieldStyles.field)}
      helpTextClassName={getTypographyClassName("footnote")}
      inputClassName={getTypographyClassName("body")}
      isRequired={isRequired}
      label={label}
      labelClassName={getTypographyClassName("body")}
      ref={ref}
      startIcon={renderStartIcon()}
      type={showPassword ? "text" : type}
      {...rest}
    />
  );
};

export const TextInput = forwardRef(_TextInput);
