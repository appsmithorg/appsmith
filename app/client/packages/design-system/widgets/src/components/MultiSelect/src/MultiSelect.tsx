import clsx from "clsx";
import React, { useRef, useState } from "react";

import { useField } from "react-aria";
import { type Selection, ListBoxItem } from "react-aria-components";
import { setInteractionModality } from "@react-aria/interactions";

import { Text } from "../../Text";
import styles from "./styles.module.css";
import { ListBox } from "../../ListBox";
import {
  Popover,
  POPOVER_LIST_BOX_MAX_HEIGHT,
  useRootContainer,
} from "../../Popover";
import { selectStyles } from "../../Select";
import { TextField } from "../../TextField";
import { FieldLabel } from "../../FieldLabel";
import { textInputStyles } from "../../Input";
import { inputFieldStyles } from "../../Field";
import type { MultiSelectProps } from "./types";
import { fieldErrorStyles } from "../../FieldError";
import { listBoxItemStyles } from "../../ListBoxItem";

import {
  DialogTrigger,
  UNSTABLE_Autocomplete,
  useFilter,
  ButtonContext,
} from "react-aria-components";
import { MultiSelectValue } from "./MultiSelectValue";
import { Checkbox } from "../../Checkbox";

const EmptyState = () => {
  return (
    <Text className={styles.emptyState} color="neutral-subtle">
      No options found
    </Text>
  );
};

/**
 * Note: React aria components does not provide us any mutliselect componennt or hooks for it.
 * We are just replicating the behaviour of mutli select component with all available hooks and components.
 * Few things are implemented manually like opening the popover on keydown or keyup when the button is focused
 * or focusing the trigger on click of label.
 *
 * This is a temporary solution until we have a mutli select component from react aria components library.
 */
export const MultiSelect = <T extends { label: string; value: string }>(
  props: MultiSelectProps<T>,
) => {
  const {
    contextualHelp,
    defaultSelectedKeys = new Set(),
    disabledKeys,
    errorMessage,
    excludeFromTabOrder,
    isDisabled,
    isInvalid,
    isLoading,
    isRequired,
    items,
    label,
    onSelectionChange: onSelectionChangeProp,
    placeholder,
    selectedKeys: selectedKeysProp,
    size,
  } = props;
  const root = useRootContainer();
  const [_selectedKeys, _setSelectedKeys] = useState<Selection>();
  const selectedKeys = selectedKeysProp ?? _selectedKeys ?? defaultSelectedKeys;
  const setSelectedKeys = onSelectionChangeProp ?? _setSelectedKeys;
  const { labelProps } = useField(props);
  const { contains } = useFilter({ sensitivity: "base" });
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Note we have to use controlled state for the popover as we need a custom logic to open the popover
  // for the usecase where we need to open the popover on keydown or keyup when the button is focused.
  const [isOpen, setOpen] = useState(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setOpen(true);
    }
  };

  const filter = (textValue: string, inputValue: string) =>
    contains(textValue, inputValue);

  return (
    <ButtonContext.Provider value={{ onKeyDown, ref: triggerRef }}>
      <div className={inputFieldStyles.field}>
        {Boolean(label) && (
          <FieldLabel
            {...labelProps}
            contextualHelp={contextualHelp}
            isDisabled={isDisabled}
            isRequired={isRequired}
            // this is required to imitate the behavior where on click of label, the trigger or input is focused.
            // In our select component,  this is done by the useSelect hook. Since we don't have that for multi select,
            // we are doing this manually here
            onClick={() => {
              if (triggerRef.current) {
                triggerRef.current.focus();

                setInteractionModality("keyboard");
              }
            }}
          >
            {label}
          </FieldLabel>
        )}
        <div
          className={clsx(
            textInputStyles.inputGroup,
            selectStyles.selectInputGroup,
          )}
        >
          <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
            <MultiSelectValue
              excludeFromTabOrder={excludeFromTabOrder}
              isDisabled={isDisabled}
              isInvalid={isInvalid}
              isLoading={isLoading}
              items={items}
              placeholder={placeholder}
              selectedKeys={selectedKeys}
              size={size}
              triggerRef={triggerRef}
            />
            <Popover
              UNSTABLE_portalContainer={root}
              className={styles.popover}
              maxHeight={POPOVER_LIST_BOX_MAX_HEIGHT}
              placement="bottom start"
              style={
                {
                  "--trigger-width": `${triggerRef?.current?.offsetWidth}px`,
                } as React.CSSProperties
              }
              triggerRef={triggerRef}
            >
              <UNSTABLE_Autocomplete filter={filter}>
                <TextField autoFocus className={styles.textField} />
                <ListBox
                  className={styles.listBox}
                  disabledKeys={disabledKeys}
                  items={items}
                  onSelectionChange={setSelectedKeys}
                  renderEmptyState={EmptyState}
                  selectedKeys={selectedKeys}
                  selectionMode="multiple"
                  shouldFocusWrap
                >
                  {(item: T) => (
                    <ListBoxItem
                      className={listBoxItemStyles.listBoxItem}
                      id={item.value}
                      textValue={item.label}
                    >
                      {({ isSelected }) => (
                        <>
                          <Checkbox isSelected={isSelected} /> {item.label}
                        </>
                      )}
                    </ListBoxItem>
                  )}
                </ListBox>
              </UNSTABLE_Autocomplete>
            </Popover>
          </DialogTrigger>
        </div>
        {/* We can't use our FieldError component as it only works when used with FieldErrorContext.
          We can use it in our Select and other inputs because the implementation is abstracted in the react aria components library.
          But since for MultiSelect, we don't have any component from react-aria, we have to manually render the error message here. */}
        <div className={fieldErrorStyles.errorText}>
          <Text color="negative" size="caption">
            {errorMessage}
          </Text>
        </div>
      </div>
    </ButtonContext.Provider>
  );
};
