import React, { useRef } from "react";
import clsx from "clsx";
import { getTypographyClassName } from "@design-system/theming";
import {
  Button,
  ListBox,
  Select as HeadlessSelect,
  SelectValue,
  FieldError,
} from "react-aria-components";
import { Text, Icon, Spinner, Popover, Label } from "@design-system/widgets";
import { ListBoxItem } from "./ListBoxItem";
import styles from "./styles.module.css";
import type { SelectProps } from "./types";

export const Select = <T extends object>(props: SelectProps<T>) => {
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
            />
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
