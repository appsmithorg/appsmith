import React, { memo } from "react";
import { ErrorMessage, SelectWrapper } from "../../styles";
import { useTableOrSpreadsheet } from "./useTableOrSpreadsheet";
import { Select, Option } from "design-system";
import { DropdownOption } from "../DatasourceDropdown/DropdownOption";
import type { DefaultOptionType } from "rc-select/lib/Select";

function TableOrSpreadsheetDropdown() {
  const { error, isLoading, label, onSelect, options, selected, show } =
    useTableOrSpreadsheet();

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        {label}
        <Select
          className="t--one-click-binding-table-selector"
          dropdownStyle={{
            minWidth: "350px",
            maxHeight: "300px",
          }}
          isLoading={isLoading}
          isValid={!error}
          onSelect={(value: string, selectedOption: DefaultOptionType) => {
            const option = options.find((d) => d.id === selectedOption.key);

            if (option) {
              onSelect(value, option);
            }
          }}
          value={selected}
          virtual={false}
        >
          {options.map((option) => {
            return (
              <Option
                className="t--one-click-binding-table-selector--table"
                key={option.id}
                value={option.value}
              >
                <DropdownOption label={option.label} leftIcon={option.icon} />
              </Option>
            );
          })}
        </Select>
        <ErrorMessage className="t--one-click-binding-table-selector--error">
          {error}
        </ErrorMessage>
      </SelectWrapper>
    );
  } else {
    return null;
  }
}

export default memo(TableOrSpreadsheetDropdown);
