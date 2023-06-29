import React, { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef, SpectrumHelpTextProps } from "@react-types/shared";

import { AlertIcon } from "./icons/AlertIcon";

interface HelpTextProps extends SpectrumHelpTextProps {
  errorMessageProps?: HTMLAttributes<HTMLElement>;
}

export const ErrorText = forwardRef(
  (props: HelpTextProps, ref: DOMRef<HTMLDivElement>) => {
    const { errorMessage, errorMessageProps, showErrorIcon } = props;
    const domRef = useDOMRef(ref);

    return (
      <div data-field-error-text="">
        {showErrorIcon && <AlertIcon />}
        <span {...errorMessageProps} ref={domRef}>
          {errorMessage}
        </span>
      </div>
    );
  },
);
