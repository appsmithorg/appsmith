import { Button, Icon, Label, Popover, Text } from "@appsmith/wds";
import { getTypographyClassName } from "@appsmith/wds-theming";
import clsx from "clsx";
import React from "react";
import {
  FieldError,
  ComboBox as HeadlessCombobox,
  Input,
  ListBox,
} from "react-aria-components";
import { ListBoxItem } from "./ListBoxItem";
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

  // place Popover in the root theme provider to get access to the CSS tokens
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

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
          <Label
            contextualHelp={contextualHelp}
            isRequired={isRequired}
            text={label}
          />

          {/* TODO: Use proper headless Input once Valera is back */}
          <div className={styles.inputWrapper}>
            <Input className={styles.input} placeholder={placeholder} />
            <Button icon="chevron-down" isLoading={isLoading} size={size} />
          </div>

          <FieldError
            className={clsx(
              styles.errorText,
              getTypographyClassName("footnote"),
            )}
          >
            {errorMessage}
          </FieldError>
          {Boolean(description) && !Boolean(isInvalid) && (
            <Text className={styles.description} lineClamp={2} size="footnote">
              {description}
            </Text>
          )}
          <Popover UNSTABLE_portalContainer={root}>
            <ListBox className={styles.listBox} items={items} shouldFocusWrap>
              {(item) => (
                <ListBoxItem key={item.id} textValue={item.label}>
                  {item.icon && <Icon name={item.icon} />}
                  {item.label}
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </>
      )}
    </HeadlessCombobox>
  );
};
