import {
  DROPDOWN_DIMENSION,
  DROPDOWN_TRIGGER_DIMENSION,
} from "components/editorComponents/WidgetQueryGeneratorForm/constants";
import {
  Label,
  SelectWrapper,
} from "components/editorComponents/WidgetQueryGeneratorForm/styles";
import { Dropdown } from "design-system-old";
import React from "react";
import { useSheets } from "./useSheets";

export function SheetsDropdown() {
  const { isLoading, label, onSelect, options, selected } = useSheets();

  return (
    <SelectWrapper className="space-y-2">
      <Label>{label}</Label>
      <Dropdown
        cypressSelector="t--sheetName-dropdown"
        dropdownMaxHeight={"300px"}
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
