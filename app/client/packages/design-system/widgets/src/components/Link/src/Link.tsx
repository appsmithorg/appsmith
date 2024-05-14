import React from "react";
import { Link as AriaLink } from "react-aria-components";

import { Text } from "../../Text";
import type { LinkProps } from "./types";
import styles from "./styles.module.css";

export function Link(props: LinkProps) {
  const {
    children,
    download,
    href,
    isDisabled,
    ping,
    referrerPolicy,
    rel,
    target,
    ...rest
  } = props;

  return (
    <Text {...rest}>
      <AriaLink
        className={styles.link}
        download={download}
        href={href}
        isDisabled={isDisabled}
        ping={ping}
        referrerPolicy={referrerPolicy}
        rel={rel}
        target={target}
      >
        {children}
      </AriaLink>
    </Text>
  );
}
