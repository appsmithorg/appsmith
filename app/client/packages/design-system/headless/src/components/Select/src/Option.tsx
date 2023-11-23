import React, { useRef } from "react";
import type { ListState } from "@react-stately/list";
import { useOption } from "@react-aria/listbox";
import type { Node } from "@react-types/shared";

import type { AutocompleteInputOption } from "./AutocompleteInput";

interface OptionProps {
  item: Node<AutocompleteInputOption>;
  state: ListState<AutocompleteInputOption>;
}
export const Option = ({ item, state }: OptionProps) => {
  const ref = useRef(null);
  const { isDisabled, isFocused, isSelected, optionProps } = useOption(
    { key: item.key },
    state,
    ref,
  );

  let backgroundColor;
  let color = "black";

  if (isSelected) {
    backgroundColor = "var(--color-bg-accent)";
    color = "white";
  } else if (isFocused) {
    backgroundColor = "gray";
  } else if (isDisabled) {
    backgroundColor = "transparent";
    color = "gray";
  }

  return (
    <li
      {...optionProps}
      ref={ref}
      style={{
        background: backgroundColor,
        color: color,
        padding: "2px 5px",
        outline: "none",
        cursor: "pointer",
      }}
    >
      {item.rendered}
    </li>
  );
};
