import React from "react";
import { noop } from "lodash";
import SelectComponent from "widgets/SelectWidget/component";
import { DropdownOption } from "widgets/SelectWidget/constants";
import {
  CellAlignment,
  CellLayoutProperties,
  TABLE_SIZES,
  VerticalAlignment,
} from "../Constants";
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
  isHidden: boolean;
  isEditable: boolean;
  tableWidth: number;
  isCellEditable?: boolean;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textColor?: string;
};

export const SelectCell = (props: SelectProps) => {
  const {
    allowCellWrapping,
    compactMode,
    horizontalAlignment,
    isCellEditable,
    isCellVisible,
    isEditable,
    isHidden,
    onItemSelect,
    options,
    tableWidth,
    textColor,
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
        compactMode={compactMode}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        verticalAlignment={verticalAlignment}
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
        allowCellWrapping={allowCellWrapping}
        columnType={ColumnTypes.SELECT}
        compactMode={compactMode}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableWidth={tableWidth}
        textColor={textColor}
        title={!!value ? value.toString() : ""}
        verticalAlignment={verticalAlignment}
      >
        {value}
      </StyledAutoToolTipComponent>
    );
  }
};
