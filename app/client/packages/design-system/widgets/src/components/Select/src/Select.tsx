import React, { useRef } from "react";
import clsx from "clsx";
import { getTypographyClassName } from "@design-system/theming";
import {
  Button,
  Label,
  ListBox,
  Popover,
  Select as SpectrumSelect,
  SelectValue,
  ListBoxItem as SpectrumListBoxItem,
  FieldError,
} from "react-aria-components";
import {
  Text,
  Icon,
  Spinner,
  ContextualHelp,
  Flex,
} from "@design-system/widgets";
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
    <SpectrumSelect
      {...rest}
      className={styles.formField}
      data-size={size}
      isRequired={isRequired}
    >
      {({ isInvalid }) => (
        <>
          <Flex alignItems="center" gap="spacing-1">
            {Boolean(label) && (
              <Label>
                <Text fontWeight={600} variant="caption">
                  {label}
                  {Boolean(isRequired) && (
                    <span
                      aria-label="(required)"
                      className={styles.necessityIndicator}
                    >
                      *
                    </span>
                  )}
                </Text>
              </Label>
            )}
            {Boolean(contextualHelp) && (
              <ContextualHelp contextualHelp={contextualHelp} />
            )}
          </Flex>
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
            <Text className={styles.description} variant="footnote">
              {description}
            </Text>
          )}
          <Popover UNSTABLE_portalContainer={root}>
            <ListBox className={styles.popover} items={items}>
              {(item) => (
                <SpectrumListBoxItem className={styles.item} key={item.key}>
                  {item.icon && <Icon name={item.icon} />}
                  {item.name}
                </SpectrumListBoxItem>
              )}
            </ListBox>
          </Popover>
        </>
      )}
    </SpectrumSelect>
  );
};
