import React from "react";
import { Menu as HeadlessMenu } from "@design-system/headless";
import type { MenuProps } from "@design-system/headless";
import { popoverStyles } from "../../../styles";

export const Menu = <T extends object>(props: MenuProps<T>) => {
  const { children, ...rest } = props;
  return (
    <HeadlessMenu className={popoverStyles.popover} {...rest}>
      {children}
    </HeadlessMenu>
  );
};
