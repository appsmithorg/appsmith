import clsx from "clsx";
import type {
  TextInputRef as HeadlessTextInputRef,
  TextInputProps as HeadlessTextInputProps,
} from "@design-system/headless";
import React, { forwardRef, useState } from "react";
import { getTypographyClassName } from "@design-system/theming";
import { TextInput as HeadlessTextInput } from "@design-system/headless";

import { Spinner } from "../../Spinner";
import { IconButton } from "../../IconButton";
import { ContextualHelp } from "./ContextualHelp";
import { textInputStyles, fieldStyles } from "../../../styles";
import type { IconProps } from "../../Icon";

export interface TextInputProps extends HeadlessTextInputProps {
  /** position for the laoding icon */
  loaderPosition?: "auto" | "start" | "end";
  /** loading state for the input */
  isLoading?: boolean;
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

  const renderStartIcon = () => {
    const showLoadingIndicator =
      isLoading &&
      (loaderPosition === "start" ||
        (Boolean(startIcon) && loaderPosition !== "end"));

    if (!showLoadingIndicator) return startIcon;

    return <Spinner />;
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

    const showLoadingIndicator =
      isLoading &&
      (loaderPosition === "end" ||
        Boolean(loaderPosition === "auto" && Boolean(startIcon)));

    if (!showLoadingIndicator) return endIcon;

    return <Spinner />;
  };

  return (
    <HeadlessTextInput
      contextualHelp={contextualHelp}
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
