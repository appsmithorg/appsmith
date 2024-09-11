import { Icon, Label, Popover, Spinner, Text } from "@appsmith/wds";
import { getTypographyClassName } from "@appsmith/wds-theming";
import clsx from "clsx";
import React, { useRef } from "react";
import {
  Button,
  FieldError,
  Select as HeadlessSelect,
  ListBox,
  SelectValue,
} from "react-aria-components";
import { ListBoxItem } from "./ListBoxItem";
import styles from "./styles.module.css";
import type { SelectProps } from "./types";

export const Select = (props: SelectProps) => {
  const {
    contextualHelp,
    description,
    errorMessage,
    isLoading,
    isRequired,
    items,
    label,
    size = "medium",
    ...rest
  } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);

  // place Popover in the root theme provider to get access to the CSS tokens
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <HeadlessSelect
      aria-label={Boolean(label) ? undefined : "Select"}
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
          <Button className={styles.textField} ref={triggerRef}>
            <SelectValue
              className={clsx(
                styles.fieldValue,
                getTypographyClassName("body"),
              )}
            >
              {({ defaultChildren, isPlaceholder }) => {
                if (isPlaceholder) {
                  return props.placeholder;
                }

                return defaultChildren;
              }}
            </SelectValue>
            {!Boolean(isLoading) && <Icon name="chevron-down" />}
            {Boolean(isLoading) && <Spinner />}
          </Button>
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
    </HeadlessSelect>
  );
};
