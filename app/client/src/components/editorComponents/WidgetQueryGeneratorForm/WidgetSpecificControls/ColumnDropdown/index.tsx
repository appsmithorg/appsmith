import { Dropdown } from "design-system-old";
import React from "react";
import {
  DROPDOWN_DIMENSION,
  DROPDOWN_TRIGGER_DIMENSION,
} from "../../constants";
import { Label, SelectWrapper } from "../../styles";
import { useColumns } from "./useColumns";

type Props = {
  label: string;
  onSelect: () => void;
};

function ColumnDropdown(props: Props) {
  const { isLoading, onSelect, options, selected } = useColumns();

  return (
    <SelectWrapper className="space-y-2">
      <Label>{props.label}</Label>
      <Dropdown
        cypressSelector="t--table-dropdown"
        dropdownMaxHeight={"300px"}
        errorMsg={options}
        height={DROPDOWN_TRIGGER_DIMENSION.HEIGHT}
        isLoading={isLoading}
        onSelect={(value: unknown) => {
          onSelect(props.label, value);
        }}
        optionWidth={DROPDOWN_DIMENSION.WIDTH}
        options={options}
        selected={selected}
        showLabelOnly
        width={DROPDOWN_TRIGGER_DIMENSION.WIDTH}
      />
    </SelectWrapper>
  );
}

export default ColumnDropdown;
