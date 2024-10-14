import React from "react";
import { clsx } from "clsx";
import { Text } from "@appsmith/wds";

import styles from "./styles.module.css";
import type { AvatarProps } from "./types";
import { getTypographyClassName } from "@appsmith/wds-theming";

export const Avatar = (props: AvatarProps) => {
  const { className, label, size, src, ...rest } = props;

  const getLabelInitials = (label: string) => {
    const names = label.split(" ");

    if (names.length === 1) {
      return `${names[0].charAt(0)}`;
    }

    return `${names[0].charAt(0)}${names[1]?.charAt(0)}`;
  };

  return (
    <span
      className={clsx(styles.avatar, className)}
      {...rest}
      data-size={size ? size : undefined}
    >
      {Boolean(src) ? (
        <img alt={label} className={styles.avatarImage} src={src} />
      ) : (
        <Text className={getTypographyClassName("body")} fontWeight={500}>
          {getLabelInitials(label)}
        </Text>
      )}
    </span>
  );
};
