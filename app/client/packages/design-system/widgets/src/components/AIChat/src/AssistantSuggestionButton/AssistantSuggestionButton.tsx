import { Text } from "@appsmith/wds";
import { clsx } from "clsx";
import React from "react";
import { Button as HeadlessButton } from "react-aria-components";
import styles from "./styles.module.css";
import type { AssistantSuggestionButtonProps } from "./types";

export const AssistantSuggestionButton = ({
  children,
  className,
  ...rest
}: AssistantSuggestionButtonProps) => {
  return (
    <HeadlessButton className={clsx(styles.root, className)} {...rest}>
      <Text>{children}</Text>
    </HeadlessButton>
  );
};
