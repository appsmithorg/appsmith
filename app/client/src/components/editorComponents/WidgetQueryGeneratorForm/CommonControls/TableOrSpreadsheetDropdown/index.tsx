import React from "react";
import { Dropdown } from "design-system-old";
import {
  DROPDOWN_DIMENSION,
  DROPDOWN_TRIGGER_DIMENSION,
} from "../../constants";
import { Label, SelectWrapper } from "../../styles";
import { useTableOrSpreadsheet } from "./useTableOrSpreadsheet";

function TableOrSpreadsheetDropdown() {
  const { isLoading, label, onSelect, options, selected } =
    useTableOrSpreadsheet();

  return (
    <SelectWrapper className="space-y-2">
      <Label>{label}</Label>
      <Dropdown
        cypressSelector="t--table-dropdown"
        dropdownMaxHeight={"300px"}
        errorMsg={options}
        height={DROPDOWN_TRIGGER_DIMENSION.HEIGHT}
        isLoading={isLoading}
        onSelect={onSelect}
        optionWidth={DROPDOWN_DIMENSION.WIDTH}
        options={options}
        selected={selected}
        showLabelOnly
        width={DROPDOWN_TRIGGER_DIMENSION.WIDTH}
      />
    </SelectWrapper>
  );
}

export default TableOrSpreadsheetDropdown;
