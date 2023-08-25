import React from "react";
import { ErrorMessage, Label, SelectWrapper } from "../../../styles";
import { Select } from "design-system";
import type { DefaultOptionType } from "rc-select/lib/Select";
import type { OtherField } from "../../../types";
import { useDropdown } from "./useDropdown";

export function OneClickDropdownFieldControl(
  props: OtherField & {
    id: string;
  },
) {
  const dropdownProps = {
    label: props.label,
    name: props.name,
    options: props.options || [],
    optionType: props.optionType,
    id: props.id,
    defaultValue: props.defaultValue,
  };

  const {
    defaultValue,
    disabled,
    error,
    handleClear,
    handleSelect,
    label,
    renderOptions,
    selected,
  } = useDropdown(dropdownProps);

  return (
    <SelectWrapper className="space-y-2">
      <Label>{label}</Label>
      <Select
        allowClear
        data-testId={`t--one-click-binding-column-${props.id}`}
        defaultValue={defaultValue}
        dropdownStyle={{
          minWidth: "350px",
          maxHeight: "300px",
        }}
        isDisabled={disabled}
        onClear={handleClear}
        onSelect={(value: string, selectedOption: DefaultOptionType) => {
          if (props.onSelect) {
            props.onSelect(value, selectedOption);
          } else {
            handleSelect(value, selectedOption);
          }
        }}
        value={selected}
        virtual={false}
      >
        {renderOptions()}
      </Select>
      <ErrorMessage>{error}</ErrorMessage>
    </SelectWrapper>
  );
}
