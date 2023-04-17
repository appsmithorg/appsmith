import React from "react";

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
    /* eslint-disable-next-line */
    return <>{children}</>;
  } else {
    return null;
  }
}
