import React, { useMemo } from "react";
import { Spinner, Input, IconButton } from "@appsmith/wds";

import styles from "./styles.module.css";
import type { ComboBoxProps } from "./types";

interface ComboBoxTriggerProps {
  size?: ComboBoxProps["size"];
  isLoading?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
}

export const ComboBoxTrigger: React.FC<ComboBoxTriggerProps> = (props) => {
  const { isDisabled, isLoading, placeholder, size } = props;

  const suffix = useMemo(() => {
    if (Boolean(isLoading)) return <Spinner />;

    return (
      <IconButton
        icon="chevron-down"
        isDisabled={isDisabled}
        size={size === "medium" ? "small" : "xSmall"}
      />
    );
  }, [isLoading, size, isDisabled]);

  return (
    <Input
      className={styles.comboboxInput}
      inputGroupClassName={styles.comboboxInputGroup}
      placeholder={placeholder}
      size={size}
      suffix={suffix}
    />
  );
};
