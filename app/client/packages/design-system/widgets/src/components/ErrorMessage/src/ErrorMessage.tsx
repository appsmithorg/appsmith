import React from "react";
import { Text } from "@appsmith/wds";
import styles from "./styles.module.css";
import type { ErrorMessageProps } from "./types";

export const ErrorMessage = (props: ErrorMessageProps) => {
  const { text } = props;

  if (!Boolean(text)) return null;

  return (
    <Text
      className={styles.errorMessage}
      color="negative"
      lineClamp={2}
      size="footnote"
    >
      {text}
    </Text>
  );
};
