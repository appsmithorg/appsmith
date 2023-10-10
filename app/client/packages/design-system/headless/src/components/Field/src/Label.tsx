import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import { filterDOMProps } from "@react-aria/utils";
import type { DOMRef, StyleProps } from "@react-types/shared";
import type { SpectrumLabelProps } from "@react-types/label";

export type LabelProps = Omit<
  SpectrumLabelProps,
  | "necessityIndicator"
  | "includeNecessityIndicatorInAccessibilityName"
  | "isRequired"
  | keyof StyleProps
  | "labelPosition"
  | "labelAlign"
>;

const _Label = (props: LabelProps, ref: DOMRef<HTMLLabelElement>) => {
  const {
    children,
    elementType: ElementType = "label",
    for: labelFor,
    htmlFor,
    onClick,
    ...otherProps
  } = props;

  const domRef = useDOMRef(ref);

  return (
    <ElementType
      data-field-label=""
      {...filterDOMProps(otherProps)}
      htmlFor={
        ElementType === "label" ? Boolean(labelFor) || htmlFor : undefined
      }
      onClick={onClick}
      ref={domRef}
    >
      {children}
    </ElementType>
  );
};

export const Label = forwardRef(_Label);
