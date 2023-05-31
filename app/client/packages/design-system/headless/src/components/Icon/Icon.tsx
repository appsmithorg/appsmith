import React from "react";
import type { AriaLabelingProps, DOMProps } from "@react-types/shared";
import type { ReactElement } from "react";
import { filterDOMProps } from "@react-aria/utils";

export interface IconProps extends DOMProps, AriaLabelingProps {
  "aria-label"?: string;
  children: ReactElement;
  "aria-hidden"?: boolean | "false" | "true";
  role?: string;
}

export function Icon(props: IconProps) {
  const {
    "aria-hidden": ariaHiddenProp,
    "aria-label": ariaLabel,
    children,
    role = "img",
    ...otherProps
  } = props;

  const ariaHidden = !ariaHiddenProp ? undefined : ariaHiddenProp;

  return React.cloneElement(children, {
    ...filterDOMProps(otherProps),
    focusable: "false",
    "aria-label": ariaLabel,
    "aria-hidden": ariaLabel ? ariaHidden || undefined : true,
    role,
    "data-icon": "",
  });
}
