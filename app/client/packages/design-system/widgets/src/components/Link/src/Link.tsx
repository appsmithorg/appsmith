import React from "react";

import { Text } from "../../Text";
import type { LinkProps } from "./types";
import styles from "./styles.module.css";

export function Link(props: LinkProps) {
  const { children, href, rel, target, ...rest } = props;

  return (
    <Text {...rest}>
      <a className={styles.link} href={href} rel={rel} target={target}>
        {children}
      </a>
    </Text>
  );
}
