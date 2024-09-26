import React from "react";
import {
  Label as HeadlessLabel,
  TagGroup as HeadlessTagGroup,
  TagList as HeadlessTagList,
  Text as HeadlessText,
} from "react-aria-components";
import type {
  TagGroupProps as HeadlessTagGroupProps,
  TagListProps as HeadlessTagListProps,
} from "react-aria-components";

import { Text } from "../../Text";
import styles from "./styles.module.css";
import { getTypographyClassName } from "@appsmith/wds-theming";

export interface TagGroupProps<T>
  extends Omit<HeadlessTagGroupProps, "children">,
    Pick<HeadlessTagListProps<T>, "items" | "children" | "renderEmptyState"> {
  label?: string;
  description?: string;
  errorMessage?: string;
}

function TagGroup<T extends object>(props: TagGroupProps<T>) {
  const {
    children,
    description,
    errorMessage,
    items,
    label,
    renderEmptyState,
    ...rest
  } = props;

  return (
    <HeadlessTagGroup {...rest} className={styles["tag-group"]}>
      {Boolean(label) && <HeadlessLabel>{<Text>{label}</Text>}</HeadlessLabel>}
      <HeadlessTagList
        className={styles["tag-list"]}
        items={items}
        renderEmptyState={renderEmptyState}
      >
        {children}
      </HeadlessTagList>
      {Boolean(description) && (
        <HeadlessText
          className={getTypographyClassName("footnote")}
          slot="description"
        >
          {description}
        </HeadlessText>
      )}
      {Boolean(errorMessage) && (
        <HeadlessText
          className={getTypographyClassName("footnote")}
          slot="errorMessage"
        >
          {errorMessage}
        </HeadlessText>
      )}
    </HeadlessTagGroup>
  );
}

export { TagGroup };
