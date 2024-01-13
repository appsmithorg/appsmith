import clsx from "clsx";
import React from "react";
import {
  Tag as HeadlessTag,
  Button as HeadlessButton,
} from "react-aria-components";
import { getTypographyClassName } from "@design-system/theming";
import type { TagProps as HeadlessTagProps } from "react-aria-components";

import styles from "./styles.module.css";
import { CloseIcon } from "../../Modal/src/CloseIcon";

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
              <CloseIcon />
            </HeadlessButton>
          )}
        </>
      )}
    </HeadlessTag>
  );
}

export { Tag };
