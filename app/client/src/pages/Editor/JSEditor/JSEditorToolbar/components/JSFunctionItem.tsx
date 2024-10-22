import type { JSActionDropdownOption } from "../types";
import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { MenuTitle } from "./styled";

export const JSFunctionItem = ({
  onSelect,
  option,
}: {
  option: JSActionDropdownOption;
  onSelect: (option: JSActionDropdownOption) => void;
}) => {
  const onFunctionSelect = useCallback(() => {
    onSelect(option);
  }, [onSelect, option]);

  return (
    <MenuItem onSelect={onFunctionSelect} size="sm">
      <MenuTitle>{option.label}</MenuTitle>
    </MenuItem>
  );
};
