import { clsx } from "clsx";
import React from "react";
import styles from "./styles.module.css";
import type { UserAvatarProps } from "./types";

export const UserAvatar = ({
  className,
  username,
  ...rest
}: UserAvatarProps) => {
  const getNameInitials = (username: string) => {
    const names = username.split(" ");

    // If there is only one name, return the first character of the name.
    if (names.length === 1) {
      return `${names[0].charAt(0)}`;
    }

    return `${names[0].charAt(0)}${names[1]?.charAt(0)}`;
  };

  return (
    <span className={clsx(styles.root, className)} {...rest}>
      {getNameInitials(username)}
    </span>
  );
};
