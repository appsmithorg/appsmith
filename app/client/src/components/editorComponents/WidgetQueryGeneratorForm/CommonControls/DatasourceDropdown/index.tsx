import React from "react";
import { Label, SelectWrapper } from "../../styles";
import type {
  DropdownOption,
  RenderDropdownOptionType,
} from "design-system-old";
import { Dropdown } from "design-system-old";
import { CONNECT_NEW_DATASOURCE_OPTION_ID } from "./option";
import {
  DROPDOWN_DIMENSION,
  DROPDOWN_TRIGGER_DIMENSION,
} from "../../constants";
import Option from "./option";
import { useDatasource } from "./useDatasource";

export const CONNECT_NEW_DATASOURCE_OPTION = {
  id: CONNECT_NEW_DATASOURCE_OPTION_ID,
  label: "Connect New Datasource",
  value: "Connect New Datasource",
  data: {
    pluginId: "",
  },
};

function DatasourceDropdown() {
  const { onSelect, options, routeToCreateNewDatasource, selected } =
    useDatasource();

  return (
    <SelectWrapper className="space-y-2">
      <Dropdown
        dropdownMaxHeight={DROPDOWN_DIMENSION.HEIGHT}
        height={DROPDOWN_TRIGGER_DIMENSION.HEIGHT}
        onSelect={onSelect}
        optionWidth={DROPDOWN_DIMENSION.WIDTH}
        options={options}
        renderOption={({
          isHighlighted,
          isSelectedNode,
          option,
          optionClickHandler,
        }: RenderDropdownOptionType) => (
          <Option
            cypressSelector="t--datasource-dropdown-option"
            extraProps={{ routeToCreateNewDatasource }}
            isHighlighted={isHighlighted}
            isSelectedNode={isSelectedNode}
            key={(option as DropdownOption).id}
            option={option}
            optionClickHandler={optionClickHandler}
            optionWidth={DROPDOWN_TRIGGER_DIMENSION.WIDTH}
          />
        )}
        selected={selected}
        showLabelOnly
        width={DROPDOWN_TRIGGER_DIMENSION.WIDTH}
      />
    </SelectWrapper>
  );
}

export default DatasourceDropdown;
