import type React from "react";

export type TAIWrapperProps = {
  windowType: "popover" | "fixed";
  className?: string;
  outsideClick?: () => void;
  children?: React.ReactNode;
  isOpen?: boolean;
};

export function AIWindow(props: TAIWrapperProps) {
  const { children, windowType } = props;
  if (windowType === "popover") {
    return children;
  } else {
    return null;
  }
}
