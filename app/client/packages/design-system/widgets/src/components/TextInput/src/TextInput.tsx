import React, { forwardRef, useState } from "react";

import clsx from "clsx";

import type {
  TextInputProps as HeadlessTextInputProps,
  TextInputRef as HeadlessTextInputRef,
} from "@appsmith/wds-headless";
import { TextInput as HeadlessTextInput } from "@appsmith/wds-headless";
import { getTypographyClassName } from "@appsmith/wds-theming";

import type { SIZES } from "../../../shared";
import { fieldStyles, textInputStyles } from "../../../styles";
import { ContextualHelp } from "../../ContextualHelp";
import type { IconProps } from "../../Icon";
import { IconButton } from "../../IconButton";
import { Spinner } from "../../Spinner";

export interface TextInputProps extends HeadlessTextInputProps {
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
    errorMessage,
    isLoading = false,
    isRequired,
    label,
    prefix,
    size = "medium",
    suffix,
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

  const renderSuffix = () => {
    if (isLoading) return <Spinner />;

    if (type === "password") {
      const icon: IconProps["name"] = showPassword ? "eye-off" : "eye";

      return (
        <IconButton
          color="neutral"
          excludeFromTabOrder
          icon={icon}
          onPress={onPressEyeIcon}
          size="small"
          variant="ghost"
        />
      );
    }

    return suffix;
  };

  return (
    <HeadlessTextInput
      contextualHelp={contextualHelp}
      data-size={Boolean(size) ? size : undefined}
      description={description}
      errorMessage={errorMessage}
      fieldClassName={clsx(textInputStyles["text-input"], fieldStyles.field)}
      helpTextClassName={getTypographyClassName("footnote")}
      inputClassName={getTypographyClassName("body")}
      isRequired={isRequired}
      label={label}
      labelClassName={getTypographyClassName("caption")}
      prefix={prefix}
      ref={ref}
      suffix={renderSuffix()}
      type={showPassword ? "text" : type}
      {...rest}
    />
  );
};

export const TextInput = forwardRef(_TextInput);
