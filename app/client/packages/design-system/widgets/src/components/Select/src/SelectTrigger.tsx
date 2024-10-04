import React from "react";
import { Icon, Spinner, textInputStyles } from "@appsmith/wds";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { Button, Group, SelectValue } from "react-aria-components";

import type { SelectProps } from "./types";

interface SelectTriggerProps {
  size?: SelectProps["size"];
  isLoading?: boolean;
  isInvalid?: boolean;
  placeholder?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = (props) => {
  const { isInvalid, isLoading, placeholder, size } = props;

  return (
    <Group className={textInputStyles.inputGroup}>
      <Button
        className={textInputStyles.input}
        data-invalid={Boolean(isInvalid) ? "" : undefined}
        data-size={size}
      >
        <SelectValue
          className={getTypographyClassName("body")}
          data-select-text=""
        >
          {({ defaultChildren, isPlaceholder }) =>
            isPlaceholder ? placeholder : defaultChildren
          }
        </SelectValue>
      </Button>
      <span data-input-suffix>
        {Boolean(isLoading) ? <Spinner /> : <Icon name="chevron-down" />}
      </span>
    </Group>
  );
};
