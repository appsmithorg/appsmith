import React from "react";
import { Text } from "@appsmith/wds";
import { FieldError as AriaFieldError } from "react-aria-components";

import styles from "./styles.module.css";
import type { FieldErrorProps } from "./types";

export const FieldError = (props: FieldErrorProps) => {
  const { children } = props;

  if (!Boolean(children)) return null;

  return (
    <AriaFieldError className={styles.errorText}>
      <Text color="negative" size="caption">
        {children}
      </Text>
    </AriaFieldError>
  );
};
