import {
  ErrorMessage,
  Label,
  SelectWrapper,
} from "components/editorComponents/WidgetQueryGeneratorForm/styles";
import { Tooltip, Select } from "@appsmith/ads";
import React, { memo } from "react";
import { useSheets } from "./useSheets";

export default memo(function SheetsDropdown() {
  const {
    error,
    isLoading,
    label,
    labelText,
    onSelect,
    options,
    selected,
    show,
  } = useSheets();

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        <Tooltip content={labelText}>
          <Label>{label}</Label>
        </Tooltip>
        <Select
          data-testid="t--sheetName-dropdown"
          dropdownStyle={{
            minWidth: "350px",
            maxHeight: "300px",
          }}
          isLoading={isLoading}
          isValid={!error}
          onSelect={onSelect}
          options={options}
          placeholder="Select sheet"
          showSearch
          value={selected}
        />
        <ErrorMessage>{error}</ErrorMessage>
      </SelectWrapper>
    );
  } else {
    return null;
  }
});
