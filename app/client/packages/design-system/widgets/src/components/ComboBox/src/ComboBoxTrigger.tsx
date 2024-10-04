import clsx from "clsx";
import React, { useMemo } from "react";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { Spinner, textInputStyles, Input, IconButton } from "@appsmith/wds";

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
      className={clsx(textInputStyles.input, getTypographyClassName("body"))}
      placeholder={placeholder}
      size={size}
      suffix={suffix}
    />
  );
};
