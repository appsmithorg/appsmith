import React from "react";
import {
  Tag as HeadlessTag,
  Button as HeadlessButton,
} from "react-aria-components";
import type { TagProps as HeadlessTagProps } from "react-aria-components";

import styles from "./styles.module.css";
import { CloseIcon } from "../../Modal/src/CloseIcon";
import { getTypographyClassName } from "@design-system/theming";

function Tag({ children, ...props }: HeadlessTagProps) {
  const textValue = typeof children === "string" ? children : undefined;

  return (
    <HeadlessTag textValue={textValue} {...props} className={styles["tag"]}>
      {({ allowsRemoving }) => (
        <>
          <span className={getTypographyClassName("footnote")}>{children}</span>
          {allowsRemoving && (
            <HeadlessButton slot="remove">
              <CloseIcon />
            </HeadlessButton>
          )}
        </>
      )}
    </HeadlessTag>
  );
}

export { Tag };
