import * as React from "react";
import { createPolymorphicComponent } from "@mantine/utils";
import { useFloatingParentNodeId, FloatingTree } from "@floating-ui/react";

import { MenuComponent } from "./MenuComponent";
import { MenuTrigger } from "./index.styled";

export type MenuProps = {
  label: string;
  nested?: boolean;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLButtonElement>;

export const Menu = React.forwardRef<HTMLButtonElement, MenuProps>(
  (props, ref) => {
    const parentId = useFloatingParentNodeId();

    if (parentId == null) {
      return (
        <FloatingTree>
          <MenuComponent {...props} ref={ref} />
        </FloatingTree>
      );
    }

    return <MenuComponent {...props} ref={ref} />;
  },
) as typeof MenuTrigger;
