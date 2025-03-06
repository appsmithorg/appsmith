import {
  Popover,
  listBoxStyles,
  useRootContainer,
  POPOVER_LIST_BOX_MAX_HEIGHT,
} from "@appsmith/wds";
import React from "react";
import { Menu as HeadlessMenu } from "react-aria-components";

import type { MenuProps } from "./types";
import clsx from "clsx";

export const Menu = (props: MenuProps) => {
  const { children, className, ...rest } = props;
  const root = useRootContainer();

  return (
    <Popover
      UNSTABLE_portalContainer={root}
      maxHeight={POPOVER_LIST_BOX_MAX_HEIGHT}
    >
      <HeadlessMenu
        className={clsx(listBoxStyles.listBox, className)}
        {...rest}
      >
        {children}
      </HeadlessMenu>
    </Popover>
  );
};
