import React, { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef, SpectrumHelpTextProps } from "@react-types/shared";

interface HelpTextProps extends Omit<SpectrumHelpTextProps, "showErrorIcon"> {
  /** Props for the help text description element. */
  descriptionProps?: HTMLAttributes<HTMLElement>;
  /** Props for the help text error message element. */
  errorMessageProps?: HTMLAttributes<HTMLElement>;
}

function _HelpText(props: HelpTextProps, ref: DOMRef<HTMLDivElement>) {
  const {
    description,
    descriptionProps,
    errorMessage,
    errorMessageProps,
    validationState,
  } = props;
  const domRef = useDOMRef(ref);
  const isErrorMessage = Boolean(errorMessage) && validationState === "invalid";

  return (
    <div ref={domRef}>
      {isErrorMessage ? (
        <div {...errorMessageProps} data-field-error-text="">
          {errorMessage}
        </div>
      ) : (
        <div {...descriptionProps} data-field-description-text="">
          {description}
        </div>
      )}
    </div>
  );
}

export const HelpText = forwardRef(_HelpText);
