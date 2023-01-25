import React from "react";
import { Portal, PortalProps } from "./Portal";

export interface OptionalPortalProps extends PortalProps {
  /** Determines if children should be rendered in Portal */
  withinPortal?: boolean;
}

export function OptionalPortal({
  children,
  withinPortal = true,
  ...others
}: OptionalPortalProps) {
  if (withinPortal) {
    return <Portal {...others}>{children}</Portal>;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

OptionalPortal.displayName = "@mantine/core/OptionalPortal";
