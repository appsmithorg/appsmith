import React, { forwardRef } from "react";

import clsx from "clsx";

import type {
  TextAreaProps as HeadlessTextAreaProps,
  TextAreaRef as HeadlessTextAreaRef,
} from "@appsmith/wds-headless";
import { TextArea as HeadlessTextArea } from "@appsmith/wds-headless";
import { getTypographyClassName } from "@appsmith/wds-theming";

import { fieldStyles, textInputStyles } from "../../../styles";
import { ContextualHelp } from "../../ContextualHelp";
import textAreaStyles from "./styles.module.css";

export interface TextAreaProps extends HeadlessTextAreaProps {
  /** loading state for the input */
  isLoading?: boolean;
}

const _TextArea = (props: TextAreaProps, ref: HeadlessTextAreaRef) => {
  const {
    contextualHelp: contextualHelpProp,
    description,
    errorMessage,
    isRequired,
    label,
    ...rest
  } = props;

  const contextualHelp = Boolean(contextualHelpProp) && (
    <ContextualHelp contextualHelp={contextualHelpProp} />
  );

  return (
    <HeadlessTextArea
      contextualHelp={contextualHelp}
      description={description}
      errorMessage={errorMessage}
      fieldClassName={clsx(
        textInputStyles["text-input"],
        fieldStyles.field,
        textAreaStyles["textarea"],
      )}
      inputClassName={getTypographyClassName("body")}
      isRequired={isRequired}
      label={label}
      labelClassName={getTypographyClassName("caption")}
      ref={ref}
      {...rest}
    />
  );
};

export const TextArea = forwardRef(_TextArea);
