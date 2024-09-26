import { Option, Select } from "@appsmith/ads";
import type { DefaultOptionType } from "rc-select/lib/Select";
import React, { memo } from "react";
import { DropdownOption } from "../../CommonControls/DatasourceDropdown/DropdownOption";
import { ErrorMessage, Label, SelectWrapper } from "../../styles";
import { useColumns } from "./useColumns";

interface Props {
  id: string;
  alias: string;
  label: string;
  onSelect: () => void;
  isSearcheable: boolean;
}

function ColumnDropdown(props: Props) {
  const { alias, isSearcheable } = props;

  const {
    disabled,
    error,
    isLoading,
    onClear,
    onSelect,
    options,
    selected,
    show,
  } = useColumns(alias, isSearcheable);

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        <Label>{props.label}</Label>
        <Select
          allowClear
          data-testId={`t--one-click-binding-column-${props.id}`}
          dropdownStyle={{
            minWidth: "350px",
            maxHeight: "300px",
          }}
          isDisabled={disabled}
          isLoading={isLoading}
          isValid={!error}
          onClear={onClear}
          onSelect={(value: string, selectedOption: DefaultOptionType) => {
            const option = options.find((d) => d.id === selectedOption.key);

            if (option) {
              onSelect(value, option);
            }
          }}
          showSearch
          value={selected}
          virtual={false}
        >
          {options.map((option) => {
            return (
              <Option
                data-testId={`t--one-click-binding-column-${props.id}--column`}
                key={option.id}
                value={option.value}
              >
                <DropdownOption label={option.label} />
              </Option>
            );
          })}
        </Select>
        <ErrorMessage>{error}</ErrorMessage>
      </SelectWrapper>
    );
  } else {
    return null;
  }
}

export default memo(ColumnDropdown);
