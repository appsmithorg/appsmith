import React from "react";
import { MenuList as HeadlessMenList } from "@design-system/headless";
import { getTypographyClassName } from "@design-system/theming";
import styles from "./styles.module.css";

import type { MenuListProps } from "@design-system/headless";

export const MenuList = <T extends object>(props: MenuListProps<T>) => {
  const { children, ...rest } = props;
  return (
    <HeadlessMenList
      itemClassName={getTypographyClassName("body")}
      listClassName={styles.menuList}
      {...rest}
    >
      {children}
    </HeadlessMenList>
  );
};
