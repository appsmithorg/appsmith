import type { Ref } from "react";
import React, { forwardRef } from "react";
import type { SpectrumFieldProps } from "@react-types/label";

import { Label } from "./Label";
import { HelpText } from "./HelpText";
import type { StyleProps } from "@react-types/shared";

export type FieldProps = Omit<
  SpectrumFieldProps,
  | "includeNecessityIndicatorInAccessibilityName"
  | "necessityIndicator"
  | "isRequired"
  | "showErrorIcon"
  | keyof StyleProps
> & {
  fieldType?: "field" | "field-group";
};

export type FieldRef = Ref<HTMLDivElement>;

const _Field = (props: FieldProps, ref: FieldRef) => {
  const {
    children,
    elementType,
    errorMessage,
    errorMessageProps = {},
    isDisabled,
    label,
    labelAlign,
    labelPosition = "top",
    labelProps,
    validationState,
    wrapperClassName,
    description,
    descriptionProps,
    wrapperProps = {},
    contextualHelp,
    fieldType = "field",
  } = props;
  const hasHelpText =
    !!description || (errorMessage && validationState === "invalid");

  const renderHelpText = () => {
    return (
      <HelpText
        description={description}
        descriptionProps={descriptionProps}
        errorMessage={errorMessage}
        errorMessageProps={errorMessageProps}
        isDisabled={isDisabled}
        validationState={validationState}
      />
    );
  };

  const labelAndContextualHelp = (
    <div data-field-label-wrapper="">
      {label && (
        <Label
          {...labelProps}
          elementType={elementType}
          labelAlign={labelAlign}
          labelPosition={labelPosition}
        >
          {label}
        </Label>
      )}
      {label && contextualHelp}
    </div>
  );

  return (
    <div
      {...wrapperProps}
      className={wrapperClassName}
      data-align={labelAlign}
      data-disabled={isDisabled ? "" : undefined}
      data-field=""
      data-field-type={fieldType}
      data-position={labelPosition}
      ref={ref}
    >
      {labelAndContextualHelp}
      <div data-field-input-wrapper="">
        {children}
        {hasHelpText && renderHelpText()}
      </div>
    </div>
  );
};

export const Field = forwardRef(_Field);
