import { Option, Select } from "design-system";
import type { DefaultOptionType } from "rc-select/lib/Select";
import React, { memo } from "react";
import { DropdownOption } from "../../CommonControls/DatasourceDropdown/DropdownOption";
import { ErrorMessage, Label, SelectWrapper } from "../../styles";
import { useColumns } from "./useColumns";

type Props = {
  alias: string;
  label: string;
  onSelect: () => void;
};

function ColumnDropdown(props: Props) {
  const { error, isLoading, onSelect, options, selected, show } = useColumns(
    props.alias,
  );

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        <Label>{props.label}</Label>
        <Select
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
        >
          {options.map((option) => {
            return (
              <Option key={option.id} value={option.value}>
                <DropdownOption label={option.label} leftIcon={option.icon} />
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
