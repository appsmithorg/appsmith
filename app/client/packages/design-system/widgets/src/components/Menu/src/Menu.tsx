import React from "react";
import { listStyles, Popover } from "@appsmith/wds";
import { Menu as HeadlessMenu } from "react-aria-components";

import type { MenuProps } from "./types";

export const Menu = (props: MenuProps) => {
  const { children } = props;
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <Popover UNSTABLE_portalContainer={root}>
      <HeadlessMenu className={listStyles.listBox} {...props}>
        {children}
      </HeadlessMenu>
    </Popover>
  );
};
