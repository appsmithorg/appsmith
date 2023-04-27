import React from "react";
import type { ReactElement } from "react";
import { filterDOMProps } from "@react-aria/utils";
import type { AriaLabelingProps, DOMProps } from "@react-types/shared";

export interface IconProps extends DOMProps, AriaLabelingProps {
  /**
   * A screen reader only label for the Icon.
   */
  "aria-label"?: string;
  /**
   * The content to display. Should be an SVG.
   */
  children: ReactElement;
  /**
   * Indicates whether the element is exposed to an accessibility API.
   */
  "aria-hidden"?: boolean | "false" | "true";
  /**
   * The class name to apply to the icon.
   * @default ""
   * */
  className?: string;
}

export type IconPropsWithoutChildren = Omit<IconProps, "children">;

export function Icon(props: IconProps) {
  const {
    "aria-hidden": ariaHiddenProps,
    "aria-label": ariaLabel,
    children,
    ...otherProps
  } = props;

  let ariaHidden = ariaHiddenProps;
  if (!ariaHidden) {
    ariaHidden = undefined;
  }

  return React.cloneElement(children, {
    ...filterDOMProps(otherProps),
    focusable: "false",
    "aria-label": ariaLabel,
    "aria-hidden": ariaLabel ? ariaHidden || undefined : true,
    role: "img",
    className: props.className,
  });
}
