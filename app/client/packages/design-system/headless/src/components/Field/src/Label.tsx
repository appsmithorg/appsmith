import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import { filterDOMProps } from "@react-aria/utils";
import type { DOMRef, StyleProps } from "@react-types/shared";
import type { SpectrumLabelProps } from "@react-types/label";

export type LabelProps = Omit<
  SpectrumLabelProps,
  keyof StyleProps | "labelPosition" | "labelAlign"
>;

const _Label = (props: LabelProps, ref: DOMRef<HTMLLabelElement>) => {
  const {
    children,
    className,
    elementType: ElementType = "label",
    for: labelFor,
    htmlFor,
    includeNecessityIndicatorInAccessibilityName,
    isRequired,
    necessityIndicator = "icon",
    onClick,
    ...otherProps
  } = props;

  const domRef = useDOMRef(ref);

  const necessityLabel = Boolean(isRequired) ? "(required)" : "(optional)";
  const icon = (
    <span
      aria-label={
        Boolean(includeNecessityIndicatorInAccessibilityName)
          ? "(required)"
          : undefined
      }
      data-field-necessity-indicator-icon=""
    >
      *
    </span>
  );

  return (
    <ElementType
      data-field-label=""
      {...filterDOMProps(otherProps)}
      className={className}
      htmlFor={
        ElementType === "label" ? Boolean(labelFor) || htmlFor : undefined
      }
      onClick={onClick}
      ref={domRef}
    >
      {children}
      {/* necessityLabel is hidden to screen readers if the field is required because
       * aria-required is set on the field in that case. That will already be announced,
       * so no need to duplicate it here. If optional, we do want it to be announced here. */}
      {(necessityIndicator === "label" ||
        (necessityIndicator === "icon" && Boolean(isRequired))) &&
        " \u200b"}
      {necessityIndicator === "label" && (
        <span
          aria-hidden={
            includeNecessityIndicatorInAccessibilityName == null
              ? isRequired
              : undefined
          }
        >
          {necessityLabel}
        </span>
      )}
      {necessityIndicator === "icon" && Boolean(isRequired) && icon}
    </ElementType>
  );
};

export const Label = forwardRef(_Label);
