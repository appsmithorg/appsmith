import clsx from "clsx";
import React, { useMemo } from "react";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { Spinner, textInputStyles, Input, IconButton } from "@appsmith/wds";

import type { ComboBoxProps } from "./types";

interface ComboBoxTriggerProps {
  size?: ComboBoxProps["size"];
  isLoading?: boolean;
  isInvalid?: boolean;
  placeholder?: string;
}

export const ComboBoxTrigger: React.FC<ComboBoxTriggerProps> = (props) => {
  const { isInvalid, isLoading, placeholder, size } = props;

  const suffix = useMemo(() => {
    if (Boolean(isLoading)) return <Spinner />;

    return (
      <IconButton
        icon="chevron-down"
        size={size === "medium" ? "small" : "xSmall"}
      />
    );
  }, [isLoading, size]);

  return (
    <Input
      className={clsx(textInputStyles.input, getTypographyClassName("body"))}
      data-invalid={Boolean(isInvalid) ? "" : undefined}
      data-size={size}
      placeholder={placeholder}
      suffix={suffix}
    />
  );
};
