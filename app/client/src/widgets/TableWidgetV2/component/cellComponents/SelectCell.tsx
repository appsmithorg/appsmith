/*
 * Select column type is not avialbe for user to choose
 * we're keeping this file for future usage
 */

import React from "react";
import { noop } from "lodash";
import SelectComponent from "widgets/SelectWidget/component";
import { DropdownOption } from "widgets/SelectWidget/constants";
import { CellAlignment, TABLE_SIZES, VerticalAlignment } from "../Constants";
import { getSelectColumnTypeOptions } from "widgets/TableWidgetV2/widget/utilities";
import { CellWrapper } from "../TableStyledWrappers";
import styled from "constants/DefaultTheme";
import AutoToolTipComponent from "./AutoToolTipComponent";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";

const StyledSelectComponent = styled(SelectComponent)`
  width: 100%;
`;

const StyledAutoToolTipComponent = styled(AutoToolTipComponent)`
  width: 100%;
`;

type SelectProps = {
  compactMode: string;
  borderRadius: string;
  options: string[];
  isCellVisible: boolean;
  onItemSelect: (value: string) => void;
  value: string;
  width: number;
  isHidden: boolean;
  isEditable: boolean;
  tableWidth: number;
  isCellEditable?: boolean;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textColor?: string;
  fontStyle?: string;
  cellBackground?: string;
  textSize?: string;
};

/*
 * TODO: Need a widgetId for each select cell.
 */
export const SelectCell = (props: SelectProps) => {
  const {
    allowCellWrapping,
    borderRadius,
    cellBackground,
    compactMode,
    fontStyle,
    horizontalAlignment,
    isCellEditable,
    isCellVisible,
    isEditable,
    isHidden,
    onItemSelect,
    options,
    tableWidth,
    textColor,
    textSize,
    value,
    verticalAlignment,
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

  if (isEditable && isCellEditable) {
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      >
        <StyledSelectComponent
          borderRadius={borderRadius}
          compactMode
          dropDownWidth={width}
          height={TABLE_SIZES[compactMode].ROW_HEIGHT}
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
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        columnType={ColumnTypes.SELECT}
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableWidth={tableWidth}
        textColor={textColor}
        textSize={textSize}
        title={!!value ? value.toString() : ""}
        verticalAlignment={verticalAlignment}
      >
        {value}
      </StyledAutoToolTipComponent>
    );
  }
};
