import React from "react";
import type { BadgeProps } from "./Badge.types";
import { StyledBadge } from "./Badge.styles";

/**
 * The Badge component is a small visual element used to display additional information,
 * typically in the form of status, count, or notification.
 *
 * @param kind
 * @param className
 * @constructor
 */
export function Badge({ className, kind = "success", ...rest }: BadgeProps) {
  return <StyledBadge className={className} kind={kind} {...rest} />;
}
