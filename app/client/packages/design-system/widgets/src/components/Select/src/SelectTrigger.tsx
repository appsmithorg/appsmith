import clsx from "clsx";
import React from "react";
import { Icon, Spinner, textInputStyles } from "@appsmith/wds";
import { getTypographyClassName } from "@appsmith/wds-theming";
import { Button, SelectValue } from "react-aria-components";

import styles from "./styles.module.css";
import type { SelectProps } from "./types";

interface SelectTriggerProps {
  size?: SelectProps["size"];
  isLoading?: boolean;
  isInvalid?: boolean;
  placeholder?: string;
  isDisabled?: boolean;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = (props) => {
  const { isDisabled, isInvalid, isLoading, placeholder, size } = props;

  return (
    <div className={clsx(textInputStyles.inputGroup, styles.selectInputGroup)}>
      <Button
        className={clsx(textInputStyles.input, styles.selectTriggerButton)}
        data-invalid={Boolean(isInvalid) ? "" : undefined}
        data-size={size}
        isDisabled={isDisabled}
      >
        <SelectValue
          className={getTypographyClassName("body")}
          data-select-text=""
        >
          {({ defaultChildren, isPlaceholder }) =>
            isPlaceholder ? placeholder : defaultChildren
          }
        </SelectValue>
        <span data-input-suffix>
          {Boolean(isLoading) ? (
            <Spinner />
          ) : (
            <Icon name="chevron-down" size="medium" />
          )}
        </span>
      </Button>
    </div>
  );
};
