// @ts-nocheck
import type {
  Collection,
  CollectionStateBase,
  FocusStrategy,
  Node,
} from "@react-types/shared";
import type { ComboBoxProps, MenuTriggerAction } from "@react-types/combobox";
import type { FormValidationState } from "@react-stately/form";
import { useFormValidationState } from "@react-stately/form";
import { getChildNodes } from "@react-stately/collections";
import {
  ListCollection,
  useListState,
  useSingleSelectListState,
} from "@react-stately/list";
import type { SelectState } from "@react-stately/select";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useControlledState } from "@react-stately/utils";
import { useMenuTriggerState } from "@react-stately/menu";

export interface ComboBoxState<T> extends SelectState<T>, FormValidationState {
  /** The current value of the combo box input. */
  inputValue: string;
  /** Sets the value of the combo box input. */
  setInputValue(value: string): void;
  /** Selects the currently focused item and updates the input value. */
  commit(): void;
  /** Opens the menu. */
  open(focusStrategy?: FocusStrategy | null, trigger?: MenuTriggerAction): void;
  /** Toggles the menu. */
  toggle(
    focusStrategy?: FocusStrategy | null,
    trigger?: MenuTriggerAction,
  ): void;
  /** Resets the input value to the previously selected item's text if any and closes the menu.  */
  revert(): void;
  selectedKeys: any;
}

type FilterFn = (textValue: string, inputValue: string) => boolean;

export interface ComboBoxStateOptions<T>
  extends Omit<ComboBoxProps<T>, "children">,
    CollectionStateBase<T> {
  /** The filter function used to determine if a option should be included in the combo box list. */
  defaultFilter?: FilterFn;
  /** Whether the combo box allows the menu to be open when the collection is empty. */
  allowsEmptyCollection?: boolean;
  /** Whether the combo box menu should close on blur. */
  shouldCloseOnBlur?: boolean;
  isMultiple?: Boolean;
}

/**
 * Provides state management for a combo box component. Handles building a collection
 * of items from props and manages the option selection state of the combo box. In addition, it tracks the input value,
 * focus state, and other properties of the combo box.
 */
export function useComboBoxState<T extends object>(
  props: ComboBoxStateOptions<T>,
): ComboBoxState<T> {
  const {
    allowsCustomValue,
    allowsEmptyCollection = false,
    defaultFilter,
    menuTrigger = "input",
    shouldCloseOnBlur = true,
    isMultiple = false,
  } = props;

  const [showAllItems, setShowAllItems] = useState(false);
  const [isFocused, setFocusedState] = useState(false);

  const onSelectionChange = (key) => {
    if (props.onSelectionChange) {
      props.onSelectionChange(key);
    }

    // If key is the same, reset the inputValue and close the menu
    // (scenario: user clicks on already selected option)
    if (!isMultiple && key === selectedKey) {
      resetInputValue();
      closeMenu();
    }
  };

  // const {
  //   collection,
  //   disabledKeys,
  //   selectedItem,
  //   selectedKey,
  //   selectionManager,
  //   setSelectedKey,
  // } = useSingleSelectListState({
  //   ...props,
  //   onSelectionChange,
  //   items: props.items ?? props.defaultItems,
  // });

  const { collection, disabledKeys, selectionManager } = useListState({
    ...props,
    selectionBehavior: "toggle",
    selectionMode: "multiple",
    onSelectionChange,
    items: props.items ?? props.defaultItems,
  });

  // console.log(selectionManager.selectedKeys);

  const [inputValue, setInputValue] = useControlledState(
    props.inputValue,
    // props.defaultInputValue ?? collection.getItem(selectedKey)?.textValue ?? "",
    "",
    props.onInputChange,
  );

  // Preserve original collection so we can show all items on demand
  const originalCollection = collection;
  const filteredCollection = useMemo(
    () =>
      // No default filter if items are controlled.
      props.items != null || !defaultFilter
        ? collection
        : filterCollection(collection, inputValue, defaultFilter),
    [collection, inputValue, defaultFilter, props.items],
  );
  const [lastCollection, setLastCollection] = useState(filteredCollection);

  // Track what action is attempting to open the menu
  const menuOpenTrigger = useRef("focus" as MenuTriggerAction);
  const onOpenChange = (open: boolean) => {
    if (props.onOpenChange) {
      props.onOpenChange(open, open ? menuOpenTrigger.current : undefined);
    }

    selectionManager.setFocused(open);
    if (!open) {
      selectionManager.setFocusedKey(null);
    }
  };

  const triggerState = useMenuTriggerState({
    ...props,
    onOpenChange,
    isOpen: undefined,
    defaultOpen: undefined,
  });
  const open = (focusStrategy?: FocusStrategy, trigger?: MenuTriggerAction) => {
    const displayAllItems =
      trigger === "manual" || (trigger === "focus" && menuTrigger === "focus");
    // Prevent open operations from triggering if there is nothing to display
    // Also prevent open operations from triggering if items are uncontrolled but defaultItems is empty, even if displayAllItems is true.
    // This is to prevent comboboxes with empty defaultItems from opening but allow controlled items comboboxes to open even if the inital list is empty (assumption is user will provide swap the empty list with a base list via onOpenChange returning `menuTrigger` manual)
    if (
      allowsEmptyCollection ||
      filteredCollection.size > 0 ||
      (displayAllItems && originalCollection.size > 0) ||
      props.items
    ) {
      if (
        displayAllItems &&
        !triggerState.isOpen &&
        props.items === undefined
      ) {
        // Show all items if menu is manually opened. Only care about this if items are undefined
        setShowAllItems(true);
      }

      menuOpenTrigger.current = trigger;
      triggerState.open(focusStrategy);
    }
  };

  const toggle = (
    focusStrategy?: FocusStrategy,
    trigger?: MenuTriggerAction,
  ) => {
    const displayAllItems =
      trigger === "manual" || (trigger === "focus" && menuTrigger === "focus");
    // If the menu is closed and there is nothing to display, early return so toggle isn't called to prevent extraneous onOpenChange
    if (
      !(
        allowsEmptyCollection ||
        filteredCollection.size > 0 ||
        (displayAllItems && originalCollection.size > 0) ||
        props.items
      ) &&
      !triggerState.isOpen
    ) {
      return;
    }

    if (displayAllItems && !triggerState.isOpen && props.items === undefined) {
      // Show all items if menu is toggled open. Only care about this if items are undefined
      setShowAllItems(true);
    }

    // Only update the menuOpenTrigger if menu is currently closed
    if (!triggerState.isOpen) {
      menuOpenTrigger.current = trigger;
    }

    toggleMenu(focusStrategy);
  };

  // If menu is going to close, save the current collection so we can freeze the displayed collection when the
  // user clicks outside the popover to close the menu. Prevents the menu contents from updating as the menu closes.
  const toggleMenu = useCallback(
    (focusStrategy) => {
      if (triggerState.isOpen) {
        setLastCollection(filteredCollection);
      }

      triggerState.toggle(focusStrategy);
    },
    [triggerState, filteredCollection],
  );

  const closeMenu = useCallback(() => {
    if (triggerState.isOpen) {
      setLastCollection(filteredCollection);
      triggerState.close();
    }
  }, [triggerState, filteredCollection]);

  const [lastValue, setLastValue] = useState(inputValue);
  const resetInputValue = () => {
    // const itemText = collection.getItem(selectedKey)?.textValue ?? "";
    const itemText = "";
    setLastValue(itemText);
    setInputValue(itemText);
  };

  const lastSelectedKey = useRef(
    props.selectedKey ?? props.defaultSelectedKey ?? null,
  );
  // const lastSelectedKeyText = useRef(
  //   collection.getItem(selectedKey)?.textValue ?? "",
  // );

  // intentional omit dependency array, want this to happen on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Open and close menu automatically when the input value changes if the input is focused,
    // and there are items in the collection or allowEmptyCollection is true.
    if (
      isFocused &&
      (filteredCollection.size > 0 || allowsEmptyCollection) &&
      !triggerState.isOpen &&
      inputValue !== lastValue &&
      menuTrigger !== "manual"
    ) {
      open(null, "input");
    }

    // Close the menu if the collection is empty. Don't close menu if filtered collection size is 0
    // but we are currently showing all items via button press
    if (
      !showAllItems &&
      !allowsEmptyCollection &&
      triggerState.isOpen &&
      filteredCollection.size === 0
    ) {
      closeMenu();
    }

    // Close when an item is selected.
    if (
      !isMultiple &&
      selectedKey != null &&
      selectedKey !== lastSelectedKey.current
    ) {
      closeMenu();
    }

    // Clear focused key when input value changes and display filtered collection again.
    if (inputValue !== lastValue) {
      selectionManager.setFocusedKey(null);
      setShowAllItems(false);

      // Set selectedKey to null when the user clears the input.
      // If controlled, this is the application developer's responsibility.
      if (
        !isMultiple &&
        inputValue === "" &&
        (props.inputValue === undefined || props.selectedKey === undefined)
      ) {
        setSelectedKey(null);
      }
    }

    // If the selectedKey changed, update the input value.
    // Do nothing if both inputValue and selectedKey are controlled.
    // In this case, it's the user's responsibility to update inputValue in onSelectionChange.
    if (
      !isMultiple &&
      selectedKey !== lastSelectedKey.current &&
      (props.inputValue === undefined || props.selectedKey === undefined)
    ) {
      resetInputValue();
    } else if (!isMultiple && lastValue !== inputValue) {
      setLastValue(inputValue);
    }

    // Update the inputValue if the selected item's text changes from its last tracked value.
    // This is to handle cases where a selectedKey is specified but the items aren't available (async loading) or the selected item's text value updates.
    // Only reset if the user isn't currently within the field so we don't erroneously modify user input.
    // If inputValue is controlled, it is the user's responsibility to update the inputValue when items change.
    // const selectedItemText = collection.getItem(selectedKey)?.textValue ?? "";
    // if (
    //   !isMultiple &&
    //   !isFocused &&
    //   selectedKey != null &&
    //   props.inputValue === undefined &&
    //   selectedKey === lastSelectedKey.current
    // ) {
    //   if (lastSelectedKeyText.current !== selectedItemText) {
    //     setLastValue(selectedItemText);
    //     setInputValue(selectedItemText);
    //   }
    // }

    // ???
    // lastSelectedKey.current = selectedKey;
    // lastSelectedKeyText.current = selectedItemText;
  });

  // ???
  // const validation = useFormValidationState({
  //   ...props,
  //   value: useMemo(
  //     () => ({ inputValue, selectedKey }),
  //     [inputValue, selectedKey],
  //   ),
  // });

  const validation = useFormValidationState({
    ...props,
    value: useMemo(() => ({ inputValue, selectedKey: "" }), [inputValue, ""]),
  });

  // Revert input value and close menu
  const revert = () => {
    if (allowsCustomValue && selectedKey == null) {
      commitCustomValue();
    } else {
      commitSelection();
    }
  };

  const commitCustomValue = () => {
    lastSelectedKey.current = null;
    setSelectedKey(null);
    closeMenu();
  };

  const commitSelection = () => {
    // If multiple things are controlled, call onSelectionChange
    if (props.selectedKey !== undefined && props.inputValue !== undefined) {
      // props.onSelectionChange(selectedKey);

      // Stop menu from reopening from useEffect
      // const itemText = collection.getItem(selectedKey)?.textValue ?? "";
      const itemText = "";
      setLastValue(itemText);
      closeMenu();
    } else {
      // If only a single aspect of combobox is controlled, reset input value and close menu for the user
      resetInputValue();
      closeMenu();
    }
  };

  const commitValue = () => {
    if (allowsCustomValue) {
      const itemText = collection.getItem(selectedKey)?.textValue ?? "";
      inputValue === itemText ? commitSelection() : commitCustomValue();
    } else {
      // Reset inputValue and close menu
      commitSelection();
    }
  };

  const commit = () => {
    if (triggerState.isOpen && selectionManager.focusedKey != null) {
      // Reset inputValue and close menu here if the selected key is already the focused key. Otherwise
      // fire onSelectionChange to allow the application to control the closing.
      if (selectedKey === selectionManager.focusedKey) {
        commitSelection();
      } else {
        setSelectedKey(selectionManager.focusedKey);
      }
    } else {
      commitValue();
    }
  };

  const valueOnFocus = useRef(inputValue);
  const setFocused = (isFocused: boolean) => {
    if (isFocused) {
      valueOnFocus.current = inputValue;
      if (menuTrigger === "focus") {
        open(null, "focus");
      }
    } else {
      if (shouldCloseOnBlur) {
        commitValue();
      }

      if (inputValue !== valueOnFocus.current) {
        validation.commitValidation();
      }
    }

    setFocusedState(isFocused);
  };

  const displayedCollection = useMemo(() => {
    if (triggerState.isOpen) {
      if (showAllItems) {
        return originalCollection;
      } else {
        return filteredCollection;
      }
    } else {
      return lastCollection;
    }
  }, [
    triggerState.isOpen,
    originalCollection,
    filteredCollection,
    showAllItems,
    lastCollection,
  ]);

  return {
    ...validation,
    ...triggerState,
    toggle,
    open,
    close: commitValue,
    selectionManager,
    selectedKeys: selectionManager.state.selectedKeys,
    // selectedKey,
    // setSelectedKey,
    disabledKeys,
    isFocused,
    setFocused,
    // selectedItem,
    collection: displayedCollection,
    inputValue,
    setInputValue,
    commit,
    revert,
  };
}

function filterCollection<T extends object>(
  collection: Collection<Node<T>>,
  inputValue: string,
  filter: FilterFn,
): Collection<Node<T>> {
  return new ListCollection(
    filterNodes(collection, collection, inputValue, filter),
  );
}

function filterNodes<T>(
  collection: Collection<Node<T>>,
  nodes: Iterable<Node<T>>,
  inputValue: string,
  filter: FilterFn,
): Iterable<Node<T>> {
  const filteredNode = [];
  for (const node of nodes) {
    if (node.type === "section" && node.hasChildNodes) {
      const filtered = filterNodes(
        collection,
        getChildNodes(node, collection),
        inputValue,
        filter,
      );
      if ([...filtered].some((node) => node.type === "item")) {
        filteredNode.push({ ...node, childNodes: filtered });
      }
    } else if (node.type === "item" && filter(node.textValue, inputValue)) {
      filteredNode.push({ ...node });
    } else if (node.type !== "item") {
      filteredNode.push({ ...node });
    }
  }
  return filteredNode;
}
