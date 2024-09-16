import React from "react";
import {
  ErrorMessage,
  FieldHint,
  Label,
  SelectWrapper,
} from "../../../../styles";
import { Select } from "@appsmith/ads";
import type { DefaultOptionType } from "rc-select/lib/Select";
import type { OtherField } from "../../../../types";
import { useDropdown } from "./useDropdown";

/* OneClickDropdownFieldControl - this component is specific to one click binding control and renders the dropdown control
 * This is just a presentational component and all the logic is handled by the useDropdown hook
 *  */
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
    allowClear: props.allowClear,
  };

  const {
    disabled,
    error,
    handleClear,
    handleSelect,
    label,
    message,
    renderOptions,
    selected,
  } = useDropdown(dropdownProps);

  return (
    <SelectWrapper className="space-y-2">
      <Label>{label}</Label>
      <Select
        allowClear={dropdownProps.allowClear}
        data-testid={`t--one-click-binding-column-${props.id}`}
        defaultValue={selected}
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
        showSearch
        value={selected}
        virtual={false}
      >
        {renderOptions()}
      </Select>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <FieldHint>{message}</FieldHint>
    </SelectWrapper>
  );
}
