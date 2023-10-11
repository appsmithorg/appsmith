import React from "react";
import type { ReactElement } from "react";
import { filterDOMProps } from "@react-aria/utils";
import type { AriaLabelingProps, DOMProps } from "@react-types/shared";

export interface IconProps extends DOMProps, AriaLabelingProps {
  "aria-label"?: string;
  role?: string;
  className?: string;
  children: ReactElement;
  "aria-hidden"?: boolean | "false" | "true";
}

export function Icon(props: IconProps) {
  const {
    "aria-hidden": ariaHiddenProp,
    "aria-label": ariaLabel,
    children,
    className,
    role = "img",
    ...otherProps
  } = props;

  return React.cloneElement(children, {
    ...filterDOMProps(otherProps),
    focusable: "false",
    "aria-label": ariaLabel,
    "aria-hidden": Boolean(ariaLabel) ? ariaHiddenProp ?? undefined : true,
    role,
    "data-icon": "",
    className,
  });
}
