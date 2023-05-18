import React, { forwardRef } from "react";
import { filterDOMProps } from "@react-aria/utils";
import type { SpectrumFieldProps } from "@react-types/label";

import { Label } from "./Label";
import { ErrorText } from "./ErrorText";

export type FieldProps = SpectrumFieldProps;

export type FieldRef = any;

export const Field = forwardRef((props: FieldProps, ref: FieldRef) => {
  const {
    label,
    labelPosition = "top",
    labelAlign,
    isRequired,
    necessityIndicator,
    includeNecessityIndicatorInAccessibilityName,
    validationState,
    errorMessage,
    isDisabled,
    showErrorIcon,
    labelProps,
    errorMessageProps = {},
    elementType,
    children,
    wrapperClassName,
    wrapperProps = {},
    ...otherProps
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
      {...filterDOMProps(otherProps)}
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
