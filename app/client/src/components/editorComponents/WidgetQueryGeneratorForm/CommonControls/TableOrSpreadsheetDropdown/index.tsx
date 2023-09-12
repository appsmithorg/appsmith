import React, { memo } from "react";
import { ErrorMessage, Label, LabelWrapper, SelectWrapper } from "../../styles";
import { useTableOrSpreadsheet } from "./useTableOrSpreadsheet";
import { Select, Option, Tooltip } from "design-system";
import { DropdownOption } from "../DatasourceDropdown/DropdownOption";
import type { DefaultOptionType } from "rc-select/lib/Select";
import { ColumnSelectorModal } from "../ColumnSelectorModal";

type Props = {
  allowFieldConfig: boolean;
};

function TableOrSpreadsheetDropdown(props: Props) {
  const { allowFieldConfig } = props;
  const {
    disabled,
    error,
    isLoading,
    label,
    labelText,
    onSelect,
    options,
    selected,
    show,
  } = useTableOrSpreadsheet();

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        <LabelWrapper>
          <Tooltip content={labelText}>
            <Label>{label}</Label>
          </Tooltip>
          {allowFieldConfig && <ColumnSelectorModal isDisabled={!selected} />}
        </LabelWrapper>
        <Select
          data-testid="t--one-click-binding-table-selector"
          dropdownStyle={{
            minWidth: "350px",
            maxHeight: "300px",
          }}
          isDisabled={disabled}
          isLoading={isLoading}
          isValid={!error}
          onSelect={(value: string, selectedOption: DefaultOptionType) => {
            const option = options.find(
              (d: DefaultOptionType) => d.id === selectedOption.key,
            );

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
                data-testId="t--one-click-binding-table-selector--table"
                key={option.id}
                value={option.value}
              >
                <DropdownOption label={option.label} leftIcon={option.icon} />
              </Option>
            );
          })}
        </Select>
        <ErrorMessage data-testId="t--one-click-binding-table-selector--error">
          {error}
        </ErrorMessage>
      </SelectWrapper>
    );
  } else {
    return null;
  }
}

export default memo(TableOrSpreadsheetDropdown);
