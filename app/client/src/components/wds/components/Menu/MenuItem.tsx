import * as React from "react";

interface MenuItemProps {
  label: string;
  disabled?: boolean;
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
