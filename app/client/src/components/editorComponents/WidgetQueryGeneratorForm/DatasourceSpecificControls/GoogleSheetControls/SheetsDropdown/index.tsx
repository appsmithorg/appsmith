import { DROPDOWN_TRIGGER_DIMENSION } from "components/editorComponents/WidgetQueryGeneratorForm/constants";
import {
  Label,
  SelectWrapper,
} from "components/editorComponents/WidgetQueryGeneratorForm/styles";
import { Dropdown } from "design-system-old";
import React from "react";
import { useSheets } from "./useSheets";

export function SheetsDropdown() {
  const { error, isLoading, label, onSelect, options, selected, show } =
    useSheets();

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        <Label>{label}</Label>
        <Dropdown
          cypressSelector="t--sheetName-dropdown"
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
