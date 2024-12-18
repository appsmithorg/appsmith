import {
  Popover,
  ListBox,
  FieldLabel,
  FieldError,
  inputFieldStyles,
  useRootContainer,
  POPOVER_LIST_BOX_MAX_HEIGHT,
} from "@appsmith/wds";
import React from "react";
import { ComboBox as HeadlessCombobox } from "react-aria-components";

import styles from "./styles.module.css";
import type { ComboBoxProps } from "./types";
import { ComboBoxTrigger } from "./ComboBoxTrigger";

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
  const root = useRootContainer();

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
        isOpen
        maxHeight={POPOVER_LIST_BOX_MAX_HEIGHT}
      >
        <ListBox shouldFocusWrap>{children}</ListBox>
      </Popover>
    </HeadlessCombobox>
  );
};
