import React from "react";

import clsx from "clsx";
import {
  Button as HeadlessButton,
  Tag as HeadlessTag,
} from "react-aria-components";
import type { TagProps as HeadlessTagProps } from "react-aria-components";

import { getTypographyClassName } from "@appsmith/wds-theming";

import { Icon } from "../../Icon";
import styles from "./styles.module.css";

function Tag({ children, ...props }: HeadlessTagProps) {
  const textValue = typeof children === "string" ? children : undefined;

  return (
    <HeadlessTag
      textValue={textValue}
      {...props}
      className={clsx(styles["tag"], getTypographyClassName("footnote"))}
    >
      {({ allowsRemoving }) => (
        <>
          <span>{children}</span>
          {allowsRemoving && (
            <HeadlessButton slot="remove">
              <Icon name="x" />
            </HeadlessButton>
          )}
        </>
      )}
    </HeadlessTag>
  );
}

export { Tag };
