import classNames from "classnames";
import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { filterDOMProps } from "@react-aria/utils";
import AsteriskIcon from "remixicon-react/AsteriskIcon";
import type { SpectrumLabelProps } from "@react-types/label";

export const Label = forwardRef(
  (props: SpectrumLabelProps, ref: DOMRef<HTMLLabelElement>) => {
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
        className="required-icon"
      />
    );

    const labelClassNames = classNames("fieldLabel", {
      "fieldLabel--positionSide": labelPosition === "side",
      "fieldLabel--alignEnd": labelAlign === "end",
    });

    return (
      <ElementType
        {...filterDOMProps(otherProps)}
        className={labelClassNames}
        htmlFor={ElementType === "label" ? labelFor || htmlFor : undefined}
        onClick={onClick}
        ref={domRef}
      >
        {children}
        {(necessityIndicator === "label" ||
          (necessityIndicator === "icon" && isRequired)) &&
          " \u200b"}
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
