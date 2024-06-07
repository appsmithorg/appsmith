import React from "react";
import { Link as HeadlessLink } from "react-aria-components";

import { Text } from "../../Text";
import type { LinkProps } from "./types";
import styles from "./styles.module.css";

export function Link(props: LinkProps) {
  const {
    children,
    download,
    href,
    ping,
    referrerPolicy,
    rel,
    target,
    ...rest
  } = props;

  return (
    <HeadlessLink
      className={styles.link}
      download={download}
      href={href}
      ping={ping}
      referrerPolicy={referrerPolicy}
      rel={rel}
      target={target}
    >
      <Text color="accent" {...rest}>
        {children}
      </Text>
    </HeadlessLink>
  );
}
