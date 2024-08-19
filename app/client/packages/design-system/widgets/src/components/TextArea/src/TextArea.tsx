import clsx from "clsx";
import React, { forwardRef } from "react";
import type {
  TextAreaRef as HeadlessTextAreaRef,
  TextAreaProps as HeadlessTextAreaProps,
} from "@appsmith/wds-headless";
import { TextArea as HeadlessTextArea } from "@appsmith/wds-headless";

import textAreaStyles from "./styles.module.css";
import { textInputStyles, fieldStyles } from "../../../styles";
import { ContextualHelp } from "../../ContextualHelp";
import { getTypographyClassName } from "@appsmith/wds-theming";

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
