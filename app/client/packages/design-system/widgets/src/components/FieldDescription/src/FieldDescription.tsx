import React from "react";
import { Text } from "../../Text";
import styles from "./styles.module.css";
import type { FieldDescriptionProps } from "./types";

export const FieldDescription = (props: FieldDescriptionProps) => {
  const { description, isInvalid } = props;

  if (!Boolean(description) || Boolean(isInvalid)) return null;

  return (
    <Text className={styles.description} lineClamp={2} size="footnote">
      {description}
    </Text>
  );
};
