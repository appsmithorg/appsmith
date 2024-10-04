import React from "react";
import { Text } from "@appsmith/wds";
import { Text as AriaText } from "react-aria-components";
import type { TextProps as AriaTextProps } from "react-aria-components";

import styles from "./styles.module.css";

export const FieldDescription = (props: AriaTextProps) => {
  const { children } = props;

  if (!Boolean(children)) return null;

  return (
    <AriaText className={styles.description} slot="description">
      <Text lineClamp={2} size="footnote">
        {children}
      </Text>
    </AriaText>
  );
};
