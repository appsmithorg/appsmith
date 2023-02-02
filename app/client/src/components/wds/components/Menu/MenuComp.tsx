import { FloatingNode, useFloatingNodeId } from "@floating-ui/react";
import React from "react";
import { MenuContext } from "./MenuContext";
import { useMenu } from "./useMenu";

type MenuProps = {
  children?: React.ReactNode;
};

export const MenuComponent = React.forwardRef<
  HTMLButtonElement,
  MenuProps & React.HTMLProps<HTMLButtonElement>
>(({ children, ...props }, forwardedRef) => {
  const menu = useMenu();
  const nodeid = useFloatingNodeId();
  return (
    <MenuContext.Provider value={menu}>
      <FloatingNode id={nodeid}>{children}</FloatingNode>
    </MenuContext.Provider>
  );
});
