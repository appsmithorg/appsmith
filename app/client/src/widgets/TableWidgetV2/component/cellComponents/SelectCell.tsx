import React from "react";
import SelectComponent from "widgets/SelectWidget/component";
import { DropdownOption } from "widgets/SelectWidget/constants";
import { CellAlignment, TABLE_SIZES, VerticalAlignment } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import styled from "constants/DefaultTheme";
import { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { BasicCell } from "./BasicCell";
import { useCallback } from "react";

const StyledSelectComponent = styled(SelectComponent)<{
  accentColor: string;
  height: number;
}>`
  &&& {
    width: 100%;

    .bp3-control-group {
      height: ${(props) => props.height}px;

      & > :only-child {
        border-radius: 0;
      }

      & button.bp3-button {
        padding: 0 9px;
        min-height: 30px;
      }
    }

    .bp3-popover-target > div {
      width: 100%;
    }
  }
`;

const StyledCellWrapper = styled(CellWrapper)`
  padding: 0px;
`;

type SelectProps = {
  alias: string;
  accentColor: string;
  compactMode: string;
  columnType: string;
  borderRadius: string;
  options: DropdownOption[];
  isCellVisible: boolean;
  onFilterChange: (
    text: string,
    rowIndex: number,
    serverSideFiltering: boolean,
    alias: string,
    action?: string,
  ) => void;
  onItemSelect: (
    value: string,
    rowIndex: number,
    column: string,
    action?: string,
  ) => void;
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
  isCellEditMode?: boolean;
  disabledEditIcon: boolean;
  hasUnsavedChanges?: boolean;
  toggleCellEditMode: (
    enable: boolean,
    rowIndex: number,
    alias: string,
    value: string | number,
    onSubmit?: string,
    action?: EditableCellActions,
  ) => void;
  rowIndex: number;
  isFilterable?: boolean;
  serverSideFiltering?: boolean;
  filterText?: string;
  placeholderText?: string;
  resetFilterTextOnClose?: boolean;
  onOptionSelectActionString?: string;
  onFilterChangeActionString?: string;
};

/*
 * TODO: Need a widgetId for each select cell.
 */
export const SelectCell = (props: SelectProps) => {
  const {
    accentColor,
    alias,
    allowCellWrapping,
    borderRadius,
    cellBackground,
    columnType,
    compactMode,
    disabledEditIcon,
    filterText,
    fontStyle,
    hasUnsavedChanges,
    horizontalAlignment,
    isCellEditable,
    isCellEditMode,
    isCellVisible,
    isEditable,
    isFilterable = false,
    isHidden,
    onFilterChange,
    onItemSelect,
    onFilterChangeActionString,
    onOptionSelectActionString,
    options = [],
    placeholderText,
    resetFilterTextOnClose,
    rowIndex,
    serverSideFiltering = false,
    tableWidth,
    textColor,
    textSize,
    toggleCellEditMode,
    value,
    verticalAlignment,
    width,
  } = props;
  const onSelect = useCallback(
    (option: DropdownOption) => {
      onItemSelect(
        option.value || "",
        rowIndex,
        alias,
        onOptionSelectActionString,
      );
    },
    [onItemSelect, rowIndex, alias, onOptionSelectActionString],
  );

  const onFilter = useCallback(
    (text: string) => {
      onFilterChange(
        text,
        rowIndex,
        serverSideFiltering,
        alias,
        onFilterChangeActionString,
      );
    },
    [
      onFilterChange,
      rowIndex,
      serverSideFiltering,
      onFilterChangeActionString,
      alias,
    ],
  );

  const onClose = useCallback(
    () => toggleCellEditMode(false, rowIndex, alias, value),
    [toggleCellEditMode, rowIndex, alias, value],
  );

  const onClick = useCallback((e) => e.stopPropagation(), []);

  const selectedIndex = options
    .map((d: DropdownOption) => d.value)
    .indexOf(value);

  if (isEditable && isCellEditable && isCellEditMode) {
    return (
      <StyledCellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        onClick={onClick}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      >
        <StyledSelectComponent
          accentColor={accentColor}
          borderRadius={borderRadius}
          compactMode
          dropDownWidth={width}
          filterText={filterText}
          height={TABLE_SIZES[compactMode].ROW_HEIGHT}
          hideCancelIcon
          isFilterable={isFilterable}
          isLoading={false}
          isOpen
          isValid
          labelText=""
          onClose={onClose}
          onFilterChange={onFilter}
          onOptionSelected={onSelect}
          options={options}
          placeholder={placeholderText}
          resetFilterTextOnClose={resetFilterTextOnClose}
          selectedIndex={selectedIndex}
          serverSideFiltering={serverSideFiltering}
          value={value}
          widgetId={""}
          width={width}
        />
      </StyledCellWrapper>
    );
  } else {
    const onEdit = () => toggleCellEditMode(true, rowIndex, alias, value);

    return (
      <BasicCell
        accentColor={accentColor}
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        columnType={columnType}
        compactMode={compactMode}
        disabledEditIcon={disabledEditIcon}
        fontStyle={fontStyle}
        hasUnsavedChanges={hasUnsavedChanges}
        horizontalAlignment={horizontalAlignment}
        isCellEditMode={isCellEditMode}
        isCellEditable={isCellEditable}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        onEdit={onEdit}
        tableWidth={tableWidth}
        textColor={textColor}
        textSize={textSize}
        value={value}
        verticalAlignment={verticalAlignment}
      />
    );
  }
};
