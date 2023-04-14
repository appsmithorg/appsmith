import { Dropdown } from "design-system-old";
import React from "react";
import { DROPDOWN_TRIGGER_DIMENSION } from "../../constants";
import { Label, SelectWrapper } from "../../styles";
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
        <Dropdown
          cypressSelector="t--table-dropdown"
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

export default ColumnDropdown;
