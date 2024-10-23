import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import type { JSActionDropdownOption } from "../types";
import * as Styled from "./styles";

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
      <Styled.MenuTitle>{option.label}</Styled.MenuTitle>
    </MenuItem>
  );
};
