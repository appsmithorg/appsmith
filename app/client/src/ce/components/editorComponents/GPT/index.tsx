import type React from "react";

export type TAIWrapperProps = {
  windowType: "popover" | "fixed";
  className?: string;
  enableOutsideClick?: boolean;
  children?: React.ReactNode;
};

export function AIWindow(props: TAIWrapperProps) {
  const { children, windowType } = props;
  if (windowType === "popover") {
    return children;
  } else {
    return null;
  }
}
