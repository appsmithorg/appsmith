import React, { useRef } from "react";
import type { ListState } from "@react-stately/list";
import { useOption } from "@react-aria/listbox";
import type { Node } from "@react-types/shared";
import { popoverStyles } from "../../../styles";

import type { AutocompleteInputOption } from "./Select";

interface OptionProps {
  item: Node<AutocompleteInputOption>;
  state: ListState<AutocompleteInputOption>;
}
export const Option = ({ item, state }: OptionProps) => {
  const ref = useRef(null);
  const { isDisabled, isFocused, isPressed, isSelected, optionProps } =
    useOption({ key: item.key }, state, ref);

  return (
    <li
      {...optionProps}
      className={popoverStyles.popoverList}
      data-active={isPressed ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocused ? "" : undefined}
      data-hovered={isFocused ? "" : undefined}
      data-selected={isSelected ? "" : undefined}
      data-separator={Boolean(item.props.isSeparator) ? "" : undefined}
      ref={ref}
    >
      {item.rendered}
    </li>
  );
};
