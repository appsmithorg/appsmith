import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import { filterDOMProps } from "@react-aria/utils";
import type { DOMRef } from "@react-types/shared";
import type { SpectrumLabelProps } from "@react-types/label";

export interface LabelProps
  extends Omit<
    SpectrumLabelProps,
    | "necessityIndicator"
    | "includeNecessityIndicatorInAccessibilityName"
    | "isRequired"
  > {
  isEmphasized?: boolean;
  labelWidth?: string;
}

const _Label = (props: LabelProps, ref: DOMRef<HTMLLabelElement>) => {
  const {
    children,
    labelPosition = "top",
    labelAlign = labelPosition === "side" ? "start" : null,
    htmlFor,
    for: labelFor,
    elementType: ElementType = "label",
    onClick,
    ...otherProps
  } = props;

  const domRef = useDOMRef(ref);

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
    </ElementType>
  );
};

export const Label = forwardRef(_Label);
