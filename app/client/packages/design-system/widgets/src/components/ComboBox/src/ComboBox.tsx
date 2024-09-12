import {
  FieldError,
  FieldDescription,
  FieldLabel,
  FieldListPopover,
  Button,
} from "@appsmith/wds";
import React from "react";
import { ComboBox as HeadlessCombobox, Input } from "react-aria-components";
import styles from "./styles.module.css";
import type { ComboBoxProps } from "./types";

export const ComboBox = (props: ComboBoxProps) => {
  const {
    contextualHelp,
    description,
    errorMessage,
    isLoading,
    isRequired,
    items,
    label,
    placeholder,
    size = "medium",
    ...rest
  } = props;

  return (
    <HeadlessCombobox
      aria-label={Boolean(label) ? undefined : "ComboBox"}
      className={styles.formField}
      data-size={size}
      isRequired={isRequired}
      {...rest}
    >
      {({ isInvalid }) => (
        <>
          <FieldLabel
            contextualHelp={contextualHelp}
            isRequired={isRequired}
            text={label}
          />
          <div className={styles.inputWrapper}>
            <Input className={styles.input} placeholder={placeholder} />
            <Button
              icon="chevron-down"
              isLoading={isLoading}
              size={size}
              slot={Boolean(isLoading) ? null : ""}
            />
          </div>
          <FieldError errorMessage={errorMessage} />
          <FieldDescription description={description} isInvalid={isInvalid} />
          <FieldListPopover items={items} />
        </>
      )}
    </HeadlessCombobox>
  );
};
