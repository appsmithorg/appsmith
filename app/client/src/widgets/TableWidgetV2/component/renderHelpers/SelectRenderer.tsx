import React from "react";
import { noop } from "lodash";
import SelectComponent from "widgets/SelectWidget/component";
import { DropdownOption } from "widgets/SelectWidget/constants";
import { CellLayoutProperties, TABLE_SIZES } from "../Constants";
import { getSelectColumnTypeOptions } from "widgets/TableWidgetV2/widget/utilities";
import { CellWrapper } from "../TableStyledWrappers";
import styled from "constants/DefaultTheme";
import AutoToolTipComponent from "../cellComponents/AutoToolTipComponent";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";

const StyledSelectComponent = styled(SelectComponent)`
  width: 100%;
`;

const StyledAutoToolTipComponent = styled(AutoToolTipComponent)`
  width: 100%;
`;

type SelectProps = {
  compactMode: string;
  options: string[];
  isCellVisible: boolean;
  onItemSelect: (value: string) => void;
  value: string;
  width: number;
  cellProperties: CellLayoutProperties;
  isHidden: boolean;
  isEditable: boolean;
  tableWidth: number;
};

export const renderSelect = (props: SelectProps) => {
  const {
    cellProperties,
    compactMode,
    isCellVisible,
    isEditable,
    isHidden,
    onItemSelect,
    options,
    tableWidth,
    value,
    width,
  } = props;

  const onSelect = (option: DropdownOption) => {
    onItemSelect(option.value || "");
  };

  const prepatedOptions = getSelectColumnTypeOptions(options) as Array<string>;

  const optionsObject = (prepatedOptions || []).map((option) => ({
    label: option,
    value: option,
  }));

  const selectedIndex = prepatedOptions.indexOf(value);

  if (isEditable && cellProperties.isCellEditable) {
    return (
      <CellWrapper
        cellProperties={cellProperties}
        compactMode={compactMode}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
      >
        <StyledSelectComponent
          compactMode
          dropDownWidth={width}
          height={TABLE_SIZES[compactMode].ROW_HEIGHT}
          hideCloseIcon
          isFilterable={false}
          isLoading={false}
          isValid
          labelText=""
          onFilterChange={noop}
          onOptionSelected={onSelect}
          options={optionsObject}
          selectedIndex={selectedIndex}
          serverSideFiltering={false}
          value={value}
          widgetId={""}
          width={width}
        />
      </CellWrapper>
    );
  } else {
    return (
      <StyledAutoToolTipComponent
        cellProperties={cellProperties}
        columnType={ColumnTypes.SELECT}
        compactMode={compactMode}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableWidth={tableWidth}
        title={!!value ? value.toString() : ""}
      >
        {value}
      </StyledAutoToolTipComponent>
    );
  }
};
