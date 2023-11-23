import React from "react";
import { useFilter } from "@react-aria/i18n";
import type { ListProps } from "@react-stately/list";
import { useComboBoxState } from "./hooks/useComboBoxState";
import { useComboBox } from "@react-aria/combobox";
import { ListBox } from "./ListBox";
import { Button } from "../../Button";
import {
  useFloating,
  useInteractions,
  useClick,
  useDismiss,
  useRole,
  FloatingPortal,
  flip,
  offset,
  size,
  autoUpdate,
} from "@floating-ui/react";
import { Item } from "@react-stately/collections";

const DEFAULT_POPOVER_OFFSET = 10;

export interface AutocompleteInputOption {
  label: string | number;
  value: string | number;
}
export type AutocompleteInputOnChangeHandler = (
  options: AutocompleteInputOption[],
) => void;
export interface BaseProps<T extends AutocompleteInputOption>
  extends ListProps<T> {
  onChange?: AutocompleteInputOnChangeHandler;
  placeholder?: string;
  selectedItems?: string[];
  options?: T[];
  name?: string;
  size?: any;
  listProps?: ListProps<T>;
  disabled?: boolean;
  noResultsMessage?: string;
  hasErrors?: boolean;
  radius?: any;
  borderWidth?: any;
}
export const AutocompleteBase = (props: any) => {
  // const { contains } = useFilter({ sensitivity: "base" });
  const buttonRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const listBoxRef = React.useRef(null);

  // Store ComboBox input value, selected option, open state, and items
  // in a state tracker
  const [fieldState, setFieldState] = React.useState<any>({
    selectedKey: "",
    inputValue: "",
    items: props.defaultItems,
  });

  // Specify how each of the ComboBox values should change when an
  // option is selected from the list box
  const onSelectionChange = (key) => {
    setFieldState((prevState) => {
      const selectedItem = prevState.items.find((option) => option.id === key);
      return {
        inputValue: selectedItem?.name ?? "",
        selectedKey: key,
        items: props.defaultItems,
      };
    });
  };

  // Specify how each of the ComboBox values should change when the input
  // field is altered by the user
  const onInputChange = (value) => {
    setFieldState((prevState) => ({
      inputValue: value,
      selectedKey: value === "" ? null : prevState.selectedKey,
      items: props.defaultItems.filter((item) => startsWith(item.name, value)),
    }));
  };

  // Show entire list if user opens the menu manually
  const onOpenChange = (isOpen, menuTrigger) => {
    if (menuTrigger === "manual" && isOpen) {
      setFieldState((prevState) => ({
        inputValue: prevState.inputValue,
        selectedKey: prevState.selectedKey,
        items: props.defaultItems,
      }));
    }
  };

  // Implement custom filtering logic and control what items are
  // available to the ComboBox.
  const { startsWith } = useFilter({ sensitivity: "base" });
  const state = useComboBoxState({
    ...props,
    defaultFilter: startsWith,
    onSelectionChange,
    onInputChange,
    onOpenChange,
    items: fieldState.items,
    selectedKey: fieldState.selectedKey,
    inputValue: fieldState.inputValue,
  });

  const { context, floatingStyles, refs } = useFloating({
    open: state.isOpen,
    onOpenChange: () => state.setOpen(!state.isOpen),
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(DEFAULT_POPOVER_OFFSET),
      flip(),
      size({
        apply({ availableHeight, elements, rects }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            minWidth: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  const { buttonProps, inputProps, labelProps, listBoxProps } = useComboBox(
    {
      ...props,
      shouldFocusWrap: true,
      inputRef,
      buttonRef,
      listBoxRef,
      popoverRef: refs.floating,
      items: fieldState.items,
      selectedKey: fieldState.selectedKey,
      inputValue: fieldState.inputValue,
    },
    state,
  );

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getFloatingProps, getReferenceProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const root = context.refs.domReference.current?.closest(
    "[data-theme-provider]",
  ) as HTMLElement;

  return (
    <div ref={refs.setReference} {...getReferenceProps()}>
      <label {...labelProps}>{props.label}</label>
      <input {...inputProps} ref={inputRef} />
      <Button {...buttonProps} ref={buttonRef}>
        <span aria-hidden="true">▼</span>
      </Button>
      <FloatingPortal root={root}>
        <div
          ref={refs.setFloating}
          {...getFloatingProps()}
          style={floatingStyles}
        >
          {state.isOpen && (
            <ListBox {...listBoxProps} listBoxRef={listBoxRef} state={state} />
          )}
        </div>
      </FloatingPortal>
    </div>
  );
};

type Props<T extends AutocompleteInputOption> = Omit<BaseProps<T>, "children">;

export const Autocomplete = <T extends AutocompleteInputOption>(
  props: Props<T>,
) => {
  return (
    <AutocompleteBase {...props}>
      {(item) => <Item>{item.name}</Item>}
    </AutocompleteBase>
  );
};
