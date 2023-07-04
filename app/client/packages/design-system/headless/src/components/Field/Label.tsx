import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import { filterDOMProps } from "@react-aria/utils";
import type { DOMRef } from "@react-types/shared";
import type { SpectrumLabelProps } from "@react-types/label";

import { AsteriskIcon } from "./icons/AsteriskIcon";
export interface LabelProps extends SpectrumLabelProps {
  isEmphasized?: boolean;
  labelWidth?: string;
}

export const Label = forwardRef(
  (props: LabelProps, ref: DOMRef<HTMLLabelElement>) => {
    const {
      children,
      labelPosition = "top",
      labelAlign = labelPosition === "side" ? "start" : null,
      isRequired,
      necessityIndicator = isRequired != null ? "icon" : null,
      includeNecessityIndicatorInAccessibilityName = false,
      htmlFor,
      for: labelFor,
      elementType: ElementType = "label",
      onClick,
      ...otherProps
    } = props;

    const domRef = useDOMRef(ref);

    const necessityLabel = isRequired ? "(required)" : "(optional)";
    const icon = (
      <AsteriskIcon
        aria-label={
          includeNecessityIndicatorInAccessibilityName
            ? "(required)"
            : undefined
        }
        data-field-necessity-indicator-icon=""
      />
    );

    return (
      <ElementType
        data-align={labelAlign}
        data-field-label=""
        data-position={labelPosition}
        {...filterDOMProps(otherProps)}
        htmlFor={ElementType === "label" ? labelFor || htmlFor : undefined}
        onClick={onClick}
        ref={domRef}
      >
        {children}
        {/* necessityLabel is hidden to screen readers if the field is required because
         * aria-required is set on the field in that case. That will already be announced,
         * so no need to duplicate it here. If optional, we do want it to be announced here. */}
        {necessityIndicator === "label" && (
          <span
            aria-hidden={
              !includeNecessityIndicatorInAccessibilityName
                ? isRequired
                : undefined
            }
          >
            {necessityLabel}
          </span>
        )}
        {necessityIndicator === "icon" && isRequired && icon}
      </ElementType>
    );
  },
);
