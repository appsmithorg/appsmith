import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import { filterDOMProps } from "@react-aria/utils";
import type { SpectrumLabelProps } from "@react-types/label";

// Adapted from remixicon-react/AsteriskIcon (https://github.com/Remix-Design/RemixIcon/blob/f88a51b6402562c6c2465f61a3e845115992e4c6/icons/Editor/asterisk.svg)
const AsteriskIcon = (props: { [key: string]: string | undefined }) => {
  return (
    <svg
      fill="currentColor"
      height={24}
      viewBox="0 0 24 24"
      width={24}
      {...props}
    >
      <path d="M13 3v7.267l6.294-3.633 1 1.732L14 11.999l6.294 3.635-1 1.732-6.295-3.634V21h-2v-7.268l-6.294 3.634-1-1.732L9.998 12 3.705 8.366l1-1.732L11 10.267V3h2Z" />
    </svg>
  );
};

export interface LabelProps extends SpectrumLabelProps {
  isEmphasized?: boolean;
}

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
