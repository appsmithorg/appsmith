import React from "react";
import clsx from "clsx";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { listItemStyles, Popover, Icon } from "@appsmith/wds";
import { ListBox, ListBoxItem } from "react-aria-components";
import styles from "./styles.module.css";
import type { FieldListPopoverProps } from "./types";

export const FieldListPopover = (props: FieldListPopoverProps) => {
  const { items } = props;

  // place Popover in the root theme provider to get access to the CSS tokens
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <Popover UNSTABLE_portalContainer={root}>
      <ListBox className={styles.listBox} items={items} shouldFocusWrap>
        {(item) => (
          <ListBoxItem
            className={clsx(
              listItemStyles.item,
              getTypographyClassName("body"),
            )}
            key={item.id}
            textValue={item.label}
          >
            {item.icon && <Icon name={item.icon} />}
            {item.label}
          </ListBoxItem>
        )}
      </ListBox>
    </Popover>
  );
};
