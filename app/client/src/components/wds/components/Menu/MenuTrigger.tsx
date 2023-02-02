import * as React from "react";
import { useMergeRefs } from "@floating-ui/react";

import { Button } from "../Button";
import { useMenuContext } from "./MenuContext";

interface MenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const MenuTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & MenuTriggerProps
>(function MenuTrigger({ asChild = false, children, ...props }, propRef) {
  const context = useMenuContext();
  const nested = context.nested;
  const childrenRef = (children as any).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...context.getReferenceProps({
        ...props,
        ref,
        className: `${nested ? "MenuItem" : "RootMenu"}${
          context.open ? " open" : ""
        }`,
        onClick(event) {
          event.stopPropagation();
        },
        ...(nested && {
          // Indicates this is a nested <Menu /> acting as a <MenuItem />.
          role: "menuitem",
        }),
      }),
    });
  }

  return (
    <Button
      ref={ref}
      {...context.getReferenceProps({
        ...props,
        className: `${nested ? "MenuItem" : "RootMenu"}${
          context.open ? " open" : ""
        }`,
        onClick(event) {
          event.stopPropagation();
        },
        ...(nested && {
          // Indicates this is a nested <Menu /> acting as a <MenuItem />.
          role: "menuitem",
        }),
      })}
    >
      {children}
      {nested && (
        <span aria-hidden style={{ marginLeft: 10 }}>
          ➔
        </span>
      )}
    </Button>
  );
});
