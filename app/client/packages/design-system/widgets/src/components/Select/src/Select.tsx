import React from "react";
import { useComboBoxState } from "@react-stately/combobox";
import { useFilter } from "@react-aria/i18n";
import type { ListProps } from "@react-stately/list";
import { useComboBox } from "@react-aria/combobox";
import { ListBox } from "./ListBox";
import { HiddenSelect, useSelect } from "@react-aria/select";
import { Icon } from "../../Icon";
import { Item } from "@react-stately/collections";
import { TextInput, Button } from "@design-system/widgets";
import { useButton } from "@react-aria/button";
import styles from "./styles.module.css";
import { useFocusRing } from "react-aria";
import { FocusScope } from "@react-aria/focus";
import { useOverlay } from "@react-aria/overlays";

import { useSelectState } from "@react-stately/select";

function Popover(props) {
  const ref = React.useRef();
  const { children, isOpen, onClose, popoverRef = ref } = props;

  // Handle events that should cause the popup to close,
  // e.g. blur, clicking outside, or pressing the escape key.
  const { overlayProps } = useOverlay(
    {
      isOpen,
      onClose,
      shouldCloseOnBlur: true,
      isDismissable: true,
    },
    popoverRef,
  );

  // Add a hidden <DismissButton> component at the end of the popover
  // to allow screen reader users to dismiss the popup easily.
  return (
    <FocusScope restoreFocus>
      <div
        {...overlayProps}
        ref={popoverRef}
        style={{
          position: "absolute",
          marginTop: 14,
        }}
      >
        {children}
      </div>
    </FocusScope>
  );
}

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
export const Select = (props: any) => {
  // const inputRef = React.useRef(null);
  // const listBoxRef = React.useRef(null);

  const state = useSelectState(props);
  const ref = React.useRef(null);
  const { labelProps, menuProps, triggerProps, valueProps } = useSelect(
    props,
    state,
    ref,
  );

  // Get props for the button based on the trigger props from useSelect
  const { buttonProps } = useButton(triggerProps, ref);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div {...labelProps}>{props.label}</div>
      <HiddenSelect
        label={props.label}
        name={props.name}
        state={state}
        triggerRef={ref}
      />
      <button {...buttonProps} ref={ref} style={{ height: 30, fontSize: 14 }}>
        <span {...valueProps}>
          {state.selectedItem
            ? state.selectedItem.rendered
            : "Select an option"}
        </span>
        <span aria-hidden="true" style={{ paddingLeft: 5 }}>
          ▼
        </span>
      </button>
      {state.isOpen && (
        <Popover isOpen={state.isOpen} onClose={state.close}>
          <ListBox {...menuProps} state={state} />
        </Popover>
      )}
    </div>
  );
};

// type Props<T extends AutocompleteInputOption> = Omit<BaseProps<T>, "children">;

// export const Select = <T extends AutocompleteInputOption>(props: Props<T>) => {
//   return (
//     <SelectBase {...props}>{(item) => <Item>{item.name}</Item>}</SelectBase>
//   );
// };
