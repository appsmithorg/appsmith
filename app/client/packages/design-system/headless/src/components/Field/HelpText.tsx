import classNames from "classnames";
import React, { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import AlertIcon from "remixicon-react/AlertFillIcon";
import type { DOMRef, SpectrumHelpTextProps } from "@react-types/shared";

interface HelpTextProps extends SpectrumHelpTextProps {
  descriptionProps?: HTMLAttributes<HTMLElement>;
  errorMessageProps?: HTMLAttributes<HTMLElement>;
}

export const HelpText = forwardRef(
  (props: HelpTextProps, ref: DOMRef<HTMLDivElement>) => {
    const {
      description,
      descriptionProps,
      errorMessage,
      errorMessageProps,
      isDisabled,
      showErrorIcon,
      validationState,
    } = props;
    const domRef = useDOMRef(ref);
    const isErrorMessage = errorMessage && validationState === "invalid";

    return (
      <div
        className={classNames(
          "helpText",
          `helpText--${isErrorMessage ? "negative" : "neutral"}`,
          { "is-disabled": isDisabled },
        )}
        ref={domRef}
      >
        {isErrorMessage ? (
          <>
            {showErrorIcon && <AlertIcon className="helpText-validationIcon" />}
            <div {...errorMessageProps} className="helpText-text">
              {errorMessage}
            </div>
          </>
        ) : (
          <div {...descriptionProps} className="helpText-text">
            {description}
          </div>
        )}
      </div>
    );
  },
);
