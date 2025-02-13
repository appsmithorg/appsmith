import clsx from "clsx";
import React, { useRef, useState } from "react";
import {
  FieldLabel,
  ListBoxItem,
  ListBox,
  Popover,
  TextField,
  textInputStyles,
  useRootContainer,
  type MultiSelectProps,
  TagGroup,
  Tag,
} from "@appsmith/wds";
import { useField } from "react-aria";
import type { Selection } from "react-aria-components";

import styles from "./styles.module.css";

import {
  Button,
  DialogTrigger,
  UNSTABLE_Autocomplete,
  useFilter,
} from "react-aria-components";
import { inputFieldStyles } from "@appsmith/wds";
import { VisuallyHidden } from "@react-aria/visually-hidden";

export const MultiSelect = <T extends { label: string; value: string }>(
  props: MultiSelectProps<T>,
) => {
  const {
    disabledKeys,
    excludeFromTabOrder,
    isDisabled,
    items,
    label,
    onSelectionChange: onSelectionChangeProp,
    placeholder,
    selectedKeys: selectedKeysProp,
  } = props;
  const root = useRootContainer();
  const [_selectedKeys, _setSelectedKeys] = useState<Selection>();
  const selectedKeys = selectedKeysProp ?? _selectedKeys ?? new Set<string>();
  const setSelectedKeys = onSelectionChangeProp ?? _setSelectedKeys;

  const { fieldProps, labelProps } = useField(props);

  const { contains } = useFilter({ sensitivity: "base" });
  const filter = (textValue: string, inputValue: string) =>
    contains(textValue, inputValue);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatItems = (selectedKeys: Selection) => {
    if (Boolean(selectedKeys) === false) return placeholder;

    if (items === undefined) return placeholder;

    if ([...selectedKeys].length === 0) return placeholder;

    return (
      <TagGroup onRemove={() => alert("removed ")}>
        {[...selectedKeys]
          .map((key) => [...items].find((item) => item.value === key))
          .map((item) => (
            <Tag id={item?.value} key={item?.value}>
              {item?.label}
            </Tag>
          ))}
      </TagGroup>
    );
  };

  return (
    <div className={inputFieldStyles.field}>
      {Boolean(label) && <FieldLabel {...labelProps}>{label}</FieldLabel>}
      <div
        className={clsx(textInputStyles.inputGroup, styles.selectInputGroup)}
      >
        <DialogTrigger>
          <Button
            className={clsx(textInputStyles.input, styles.selectTriggerButton)}
            excludeFromTabOrder={excludeFromTabOrder}
            isDisabled={isDisabled}
            ref={triggerRef}
            type="button"
            {...fieldProps}
          >
            <span>{formatItems(selectedKeys)}</span>
          </Button>
          <VisuallyHidden />
          <Popover
            UNSTABLE_portalContainer={root}
            placement="bottom start"
            style={
              {
                width: `${triggerRef?.current?.offsetWidth}px`,
                overflow: "auto",
              } as React.CSSProperties
            }
            triggerRef={triggerRef}
          >
            <UNSTABLE_Autocomplete filter={filter}>
              <TextField autoFocus ref={inputRef} />
              <ListBox
                disabledKeys={disabledKeys}
                items={items}
                onSelectionChange={(keys) => {
                  setSelectedKeys(keys);
                }}
                renderEmptyState={() => <div>No options</div>}
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                shouldFocusWrap
              >
                {(item: T) => (
                  <ListBoxItem
                    className={styles.listBoxItem}
                    id={item.value}
                    textValue={item.label}
                  >
                    {item.label}
                  </ListBoxItem>
                )}
              </ListBox>
            </UNSTABLE_Autocomplete>
          </Popover>
        </DialogTrigger>
      </div>
    </div>
  );
};
