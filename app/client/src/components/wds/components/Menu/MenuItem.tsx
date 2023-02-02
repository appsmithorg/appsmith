import * as React from "react";
import { useMergeRefs } from "@floating-ui/react";

import { useMenuContext } from "./MenuContext";

interface MenuItemProps {
  disabled?: boolean;
  label: string;
  children?: React.ReactNode;
}

export const MenuItem = React.forwardRef<
  HTMLButtonElement,
  MenuItemProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ disabled, label, ...props }, ref) => {
  return (
    <button {...props} disabled={disabled} ref={ref} role="menuitem">
      {label}
    </button>
  );
});
