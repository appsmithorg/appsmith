import {
  Popover,
  ListBox,
  FieldLabel,
  FieldError,
  inputFieldStyles,
} from "@appsmith/wds";
import React from "react";
import { ComboBox as HeadlessCombobox } from "react-aria-components";

import styles from "./styles.module.css";
import type { ComboBoxProps } from "./types";
import { ComboBoxTrigger } from "./ComboBoxTrigger";
import { useTheme } from "@appsmith/wds-theming";

export const ComboBox = (props: ComboBoxProps) => {
  const {
    children,
    contextualHelp,
    errorMessage,
    isDisabled,
    isLoading,
    isRequired,
    label,
    placeholder,
    size = "medium",
    ...rest
  } = props;
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;
  const { theme } = useTheme();

  return (
    <HeadlessCombobox
      aria-label={Boolean(label) ? undefined : "ComboBox"}
      className={inputFieldStyles.field}
      data-size={size}
      isDisabled={isDisabled}
      isRequired={isRequired}
      {...rest}
    >
      <FieldLabel
        contextualHelp={contextualHelp}
        isDisabled={isDisabled}
        isRequired={isRequired}
      >
        {label}
      </FieldLabel>
      <ComboBoxTrigger
        isDisabled={isDisabled}
        isLoading={isLoading}
        placeholder={placeholder}
        size={size}
      />
      <FieldError>{errorMessage}</FieldError>
      <Popover
        UNSTABLE_portalContainer={root}
        className={styles.comboboxPopover}
        containerPadding={0}
        crossOffset={
          -1 *
            Number(
              (theme.innerSpacing?.[2]?.value as string).replace("px", ""),
            ) ?? 0
        }
        offset={
          Number(
            (theme.innerSpacing?.[3]?.value as string).replace("px", ""),
          ) ?? 0
        }
      >
        <ListBox shouldFocusWrap>{children}</ListBox>
      </Popover>
    </HeadlessCombobox>
  );
};
