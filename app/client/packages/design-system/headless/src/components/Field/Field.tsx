import React, { forwardRef } from "react";
import type { SpectrumFieldProps } from "@react-types/label";

import { Label } from "./Label";
import { ErrorText } from "./ErrorText";

export type FieldProps = SpectrumFieldProps;

export type FieldRef = any;

export const Field = forwardRef((props: FieldProps, ref: FieldRef) => {
  const {
    children,
    elementType,
    errorMessage,
    errorMessageProps = {},
    includeNecessityIndicatorInAccessibilityName,
    isDisabled,
    isRequired,
    label,
    labelAlign,
    labelPosition = "top",
    labelProps,
    necessityIndicator,
    showErrorIcon,
    validationState,
    wrapperClassName,
    wrapperProps = {},
  } = props;
  const hasErrorText = errorMessage && validationState === "invalid";

  const renderErrorText = () => {
    return (
      <ErrorText
        errorMessage={errorMessage}
        errorMessageProps={errorMessageProps}
        isDisabled={isDisabled}
        showErrorIcon={showErrorIcon}
        validationState={validationState}
      />
    );
  };

  const renderChildren = () => {
    if (labelPosition === "side") {
      return (
        <div className="wrapper">
          {children}
          {hasErrorText && renderErrorText()}
        </div>
      );
    }

    return (
      <>
        {children}
        {hasErrorText && renderErrorText()}
      </>
    );
  };

  const labelAndContextualHelp = label && (
    <Label
      {...labelProps}
      elementType={elementType}
      includeNecessityIndicatorInAccessibilityName={
        includeNecessityIndicatorInAccessibilityName
      }
      isRequired={isRequired}
      labelAlign={labelAlign}
      labelPosition={labelPosition}
      necessityIndicator={necessityIndicator}
    >
      {label}
    </Label>
  );

  return (
    <div
      {...wrapperProps}
      className={wrapperClassName}
      data-align={labelAlign}
      data-disabled={isDisabled}
      data-field=""
      data-position={labelPosition}
      ref={ref}
    >
      <div>{labelAndContextualHelp}</div>
      {renderChildren()}
    </div>
  );
});
