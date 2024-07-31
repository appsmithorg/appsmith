import type React from "react";
import type { LinkProps as RouterLinkProps } from "react-router-dom";
import type { AriaLinkOptions } from "@react-aria/link";

export type LinkKind = "primary" | "secondary";

// TODO: startIcon, endIcon type should be a list containing names of allowed icons
export type LinkProps = {
  /** (try not to) pass addition classes here */
  className?: string;
  /** the words you want to display */
  children: string | React.ReactNode;
  /** the place to navigate to. Doesn't have to be present if there is an onClick */
  to?: string;
  /** the function being passed. Should only be related to managing navigation -
   * for anything else, use a button instead. If you add an onClick, the `to` prop
   * will be discarded. */
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  /** the icon at the beginning of the link */
  startIcon?: string;
  /** the icon at the end of the link */
  endIcon?: string;
  /** the kind of link */
  kind?: LinkKind;
} & Omit<RouterLinkProps, "to"> &
  AriaLinkOptions;
