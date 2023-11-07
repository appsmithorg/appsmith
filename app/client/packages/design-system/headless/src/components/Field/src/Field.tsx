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
  | "labelPosition"
  | "labelAlign"
  | keyof StyleProps
> & {
  fieldType?: "field" | "field-group";
};

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
    isDisabled = false,
    label,
    labelProps,
    validationState,
    wrapperClassName,
    wrapperProps = {},
  } = props;
  const hasHelpText =
    Boolean(description) ||
    (Boolean(errorMessage) && validationState === "invalid");

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

  const isLabelVisible = Boolean(label) || Boolean(contextualHelp);

  const labelAndContextualHelp = isLabelVisible && (
    <div data-field-label-wrapper="">
      <Label {...labelProps} elementType={elementType}>
        {label}
      </Label>
      {contextualHelp}
    </div>
  );

  return (
    <div
      {...wrapperProps}
      className={wrapperClassName}
      data-disabled={isDisabled ? "" : undefined}
      data-field=""
      data-field-type={fieldType}
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
