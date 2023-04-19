import React, { forwardRef } from "react";
import { Label } from "./Label";
import classNames from "classnames";
import { HelpText } from "./HelpText";
import { useId } from "@react-aria/utils";
import { SlotProvider } from "@react-spectrum/utils";
import type { LabelPosition } from "@react-types/shared";
import type { SpectrumFieldProps } from "@react-types/label";

export const Field = forwardRef((props: SpectrumFieldProps, ref: any) => {
  const {
    label,
    labelPosition = "top" as LabelPosition,
    labelAlign,
    isRequired,
    necessityIndicator,
    includeNecessityIndicatorInAccessibilityName,
    validationState,
    description,
    errorMessage,
    isDisabled,
    showErrorIcon,
    contextualHelp,
    labelProps,
    // Not every component that uses <Field> supports help text.
    descriptionProps = {},
    errorMessageProps = {},
    elementType,
    children,
    wrapperClassName,
    wrapperProps = {},
    ...otherProps
  } = props;
  const hasHelpText =
    !!description || (errorMessage && validationState === "invalid");
  const contextualHelpId = useId();

  const labelWrapperClass = classNames(
    "field",
    {
      "field--positionTop": labelPosition === "top",
      "field--positionSide": labelPosition === "side",
      "field--alignEnd": labelAlign === "end",
      "field--hasContextualHelp": !!props.contextualHelp,
    },
    wrapperClassName,
  );

  const renderHelpText = () => (
    <HelpText
      description={description}
      descriptionProps={descriptionProps}
      errorMessage={errorMessage}
      errorMessageProps={errorMessageProps}
      isDisabled={isDisabled}
      showErrorIcon={showErrorIcon}
      validationState={validationState}
    />
  );

  const renderChildren = () => {
    if (labelPosition === "side") {
      return (
        <div className="wrapper">
          {children}
          {hasHelpText && renderHelpText()}
        </div>
      );
    }

    return (
      <>
        {children}
        {hasHelpText && renderHelpText()}
      </>
    );
  };

  const labelAndContextualHelp = (
    <>
      {label && (
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
      )}
      {label && contextualHelp && (
        <SlotProvider
          slots={{
            actionButton: {
              className: "field-contextual-help",
              id: contextualHelpId,
              "aria-labelledby": labelProps?.id
                ? `${labelProps.id} ${contextualHelpId}`
                : undefined,
            },
          }}
        >
          {contextualHelp}
        </SlotProvider>
      )}
    </>
  );

  return (
    <div
      {...otherProps}
      {...wrapperProps}
      className={labelWrapperClass}
      ref={ref}
    >
      {labelAndContextualHelp}
      {renderChildren()}
    </div>
  );
});
