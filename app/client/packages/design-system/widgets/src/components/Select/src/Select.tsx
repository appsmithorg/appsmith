import React, { useRef } from "react";
import {
  FieldDescription,
  FieldError,
  Icon,
  FieldLabel,
  Spinner,
  FieldListPopover,
} from "@appsmith/wds";
import { getTypographyClassName } from "@appsmith/wds-theming";
import clsx from "clsx";
import {
  Button,
  Select as HeadlessSelect,
  SelectValue,
} from "react-aria-components";
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
          <FieldLabel
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
          <FieldError errorMessage={errorMessage} />
          <FieldDescription description={description} isInvalid={isInvalid} />
          <FieldListPopover items={items} />
        </>
      )}
    </HeadlessSelect>
  );
};
