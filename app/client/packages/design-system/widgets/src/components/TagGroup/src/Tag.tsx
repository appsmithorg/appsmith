import clsx from "clsx";
import React from "react";
import {
  Tag as HeadlessTag,
  Button as HeadlessButton,
} from "react-aria-components";
import { getTypographyClassName } from "@appsmith/wds-theming";
import type { TagProps as HeadlessTagProps } from "react-aria-components";

import styles from "./styles.module.css";
import { Icon } from "../../Icon";

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
