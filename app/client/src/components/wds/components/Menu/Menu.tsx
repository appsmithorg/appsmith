import * as React from "react";

import { useMenu } from "./useMenu";
import { MenuContext } from "./MenuContext";
import {
  FloatingNode,
  FloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
} from "@floating-ui/react";
import { MenuComponent } from "./MenuComp";

interface MenuProps {
  children?: React.ReactNode;
}

export const Menu = React.forwardRef<
  HTMLButtonElement,
  MenuProps & React.HTMLProps<HTMLButtonElement>
>((props, ref) => {
  const parentId = useFloatingParentNodeId();

  if (parentId == null) {
    return (
      <FloatingTree>
        <MenuComponent {...props} ref={ref} />
      </FloatingTree>
    );
  }

  return <MenuComponent {...props} ref={ref} />;
});
