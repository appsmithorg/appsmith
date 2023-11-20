import clsx from "clsx";
import React, { forwardRef } from "react";
import type {
  TextAreaRef as HeadlessTextAreaRef,
  TextAreaProps as HeadlessTextAreaProps,
} from "@design-system/headless";
import { TextArea as HeadlessTextArea } from "@design-system/headless";

import textAreaStyles from "./styles.module.css";
import { textInputStyles, fieldStyles } from "../../../styles";
import { ContextualHelp } from "../../TextInput/src/ContextualHelp";
import { getTypographyClassName } from "@design-system/theming";

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
      labelClassName={getTypographyClassName("body")}
      ref={ref}
      {...rest}
    />
  );
};

export const TextArea = forwardRef(_TextArea);
