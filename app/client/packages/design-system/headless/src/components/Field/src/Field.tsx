import type { ReactNode, Ref } from "react";
import React, { forwardRef } from "react";
import type { SpectrumFieldProps } from "@react-types/label";

import { Label } from "./Label";
import { HelpText } from "./HelpText";
export type FieldProps = Pick<
  SpectrumFieldProps,
  | "contextualHelp"
  | "description"
  | "descriptionProps"
  | "elementType"
  | "errorMessage"
  | "errorMessageProps"
  | "includeNecessityIndicatorInAccessibilityName"
  | "isDisabled"
  | "isRequired"
  | "label"
  | "labelProps"
  | "necessityIndicator"
  | "wrapperClassName"
  | "wrapperProps"
> & {
  fieldType?: "field" | "field-group";
  labelClassName?: string;
  helpTextClassName?: string;
  validationState?: ValidationState;
  children: ReactNode;
  isReadOnly?: boolean;
};

import type { ValidationState } from "@react-types/shared";

export type FieldRef = Ref<HTMLDivElement>;

const _Field = (props: FieldProps, ref: FieldRef) => {
  const {
    children,
    contextualHelp,
    description,
    descriptionProps,
    elementType,
    errorMessage,
    errorMessageProps = {},
    fieldType = "field",
    helpTextClassName,
    includeNecessityIndicatorInAccessibilityName,
    isDisabled = false,
    isReadOnly = false,
    isRequired,
    label,
    labelClassName,
    labelProps,
    necessityIndicator,
    validationState,
    wrapperClassName,
    wrapperProps = {},
  } = props;

  // Readonly has a higher priority than disabled.
  const getDisabledState = () => Boolean(isDisabled) && !Boolean(isReadOnly);

  const hasHelpText =
    Boolean(description) ||
    (Boolean(errorMessage) && validationState === "invalid");

  const renderHelpText = () => {
    return (
      <HelpText
        className={helpTextClassName}
        description={description}
        descriptionProps={descriptionProps}
        errorMessage={errorMessage}
        errorMessageProps={errorMessageProps}
        isDisabled={getDisabledState()}
        validationState={validationState}
      />
    );
  };

  const labelAndContextualHelp = (Boolean(label) ||
    Boolean(contextualHelp)) && (
    <div data-field-label-wrapper="">
      {Boolean(label) && (
        <Label
          {...labelProps}
          className={labelClassName}
          elementType={elementType}
          includeNecessityIndicatorInAccessibilityName={
            includeNecessityIndicatorInAccessibilityName
          }
          isRequired={isRequired}
          necessityIndicator={
            !Boolean(isReadOnly) ? necessityIndicator : undefined
          }
        >
          <span>{label}</span>
        </Label>
      )}
      {contextualHelp}
    </div>
  );

  return (
    <div
      {...wrapperProps}
      className={wrapperClassName}
      data-disabled={getDisabledState() ? "" : undefined}
      data-field=""
      data-field-type={fieldType}
      data-readonly={Boolean(isReadOnly) ? "" : undefined}
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
