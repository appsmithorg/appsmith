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
  inputFieldStyles,
  selectStyles,
  Text,
  POPOVER_LIST_BOX_MAX_HEIGHT,
  fieldErrorStyles,
} from "@appsmith/wds";
import { useField } from "react-aria";
import type { Selection } from "react-aria-components";
import { setInteractionModality } from "@react-aria/interactions";

import styles from "./styles.module.css";

import {
  DialogTrigger,
  UNSTABLE_Autocomplete,
  useFilter,
  ButtonContext,
} from "react-aria-components";
import MultiSelectValue from "./MultiSelectValue";

const EmptyState = () => {
  return (
    <div className={styles.emptyState}>
      <Text color="neutral-subtle">No options found</Text>
    </div>
  );
};

/**
 * Note: React aria components does not provide us any mutliselect componennt or hooks for it.
 * We are just replicating the behaviour of mutli select component with all the hooks and components
 * that are available in the react aria components library and many things are implemented manually
 * like opening the popover on keydown or keyup when the button is focused or focusing the trigger on click of label
 *
 * This is a temporary solution until we have a mutli select component in the library.
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
  const [isOpen, setOpen] = useState(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setOpen(true);
    }
  };

  const filter = (textValue: string, inputValue: string) =>
    contains(textValue, inputValue);

  return (
    // We need keydown ecent to open the popover on keydown or keyup when the button is focused.
    // We have to do this manually as we don't have any useMultiSelect hook or component.
    // There are more things that select do like focusing the first on arrow up or focusing the last on arrow down
    // We can't do all of it as we don't have access to state of listbox
    <ButtonContext.Provider value={{ onKeyDown, ref: triggerRef }}>
      <div className={inputFieldStyles.field}>
        {Boolean(label) && (
          <FieldLabel
            {...labelProps}
            contextualHelp={contextualHelp}
            isDisabled={Boolean(isDisabled) || Boolean(isLoading)}
            isRequired={isRequired}
            // this is required to imitate the behavior where on click of label, the trigger or input is focused
            // in our  this is handled by the useSelect hook. But we don't have any useMutliSelect hook or component
            // so we are just this manually here
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
              isDisabled={Boolean(isDisabled) || Boolean(isLoading)}
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
        <div className={fieldErrorStyles.errorText}>
          <Text color="negative" size="caption">
            {errorMessage}
          </Text>
        </div>
      </div>
    </ButtonContext.Provider>
  );
};
