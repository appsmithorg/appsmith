import React from "react";
import { Dropdown } from "design-system-old";
import { DROPDOWN_TRIGGER_DIMENSION } from "../../constants";
import { SelectWrapper } from "../../styles";
import { useTableOrSpreadsheet } from "./useTableOrSpreadsheet";

function TableOrSpreadsheetDropdown() {
  const { error, isLoading, label, onSelect, options, selected, show } =
    useTableOrSpreadsheet();

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        {label}
        <Dropdown
          cypressSelector="t--table-dropdown"
          dropdownMaxHeight={"300px"}
          errorMsg={error}
          fillOptions
          height={DROPDOWN_TRIGGER_DIMENSION.HEIGHT}
          isLoading={isLoading}
          onSelect={onSelect}
          options={options}
          selected={selected}
          showLabelOnly
          width={DROPDOWN_TRIGGER_DIMENSION.WIDTH}
        />
      </SelectWrapper>
    );
  } else {
    return null;
  }
}

export default TableOrSpreadsheetDropdown;
