import React from "react";
import { isNumber, isNil } from "lodash";

import {
  CellAlignment,
  CellLayoutProperties,
  VerticalAlignment,
} from "../Constants";
import {
  ColumnTypes,
  EditableCellActions,
} from "widgets/TableWidgetV2/constants";
import { TextCell } from "../cellComponents/TextCell";
import { TextSize } from "constants/WidgetConstants";

export type RenderDefaultPropsType = {
  compactMode: string;
  value: any;
  columnType: string;
  isHidden: boolean;
  tableWidth: number;
  isCellEditable: boolean;
  isCellVisible: boolean;
  isCellEditMode?: boolean;
  onCellTextChange: (data: string) => void;
  toggleCellEditMode: (editMode: boolean, action?: EditableCellActions) => void;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  cellBackground?: string;
  hasUnsavedChanged?: boolean;
  horizontalAlignment?: CellAlignment;
  textColor?: string;
  displayText?: string;
  fontStyle: string;
  textSize: TextSize;
};

export function getCellText(
  value: any,
  columnType: string,
  displayText?: string,
) {
  let text;

  if (value && columnType === ColumnTypes.URL && displayText) {
    text = displayText;
  } else if (!isNil(value) && (!isNumber(value) || !isNaN(value))) {
    text = value.toString();
  } else {
    text = "";
  }

  return text;
}

export function DefaultCell(props: RenderDefaultPropsType) {
  const {
    allowCellWrapping,
    cellBackground,
    columnType,
    compactMode,
    displayText,
    fontStyle,
    hasUnsavedChanged,
    horizontalAlignment,
    isCellEditable,
    isCellEditMode,
    isCellVisible,
    isHidden,
    onCellTextChange,
    tableWidth,
    textColor,
    textSize,
    toggleCellEditMode,
    value,
    verticalAlignment,
  } = props;

  return (
    <TextCell
      allowCellWrapping={allowCellWrapping}
      cellBackground={cellBackground}
      columnType={columnType}
      compactMode={compactMode}
      fontStyle={fontStyle}
      hasUnsavedChanged={hasUnsavedChanged}
      horizontalAlignment={horizontalAlignment}
      isCellEditMode={isCellEditMode}
      isCellEditable={isCellEditable}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      onCellTextChange={onCellTextChange}
      onChange={(text: string) => onCellTextChange(text)}
      onDiscard={() => toggleCellEditMode(false, EditableCellActions.DISCARD)}
      onSave={() => toggleCellEditMode(false, EditableCellActions.SAVE)}
      tableWidth={tableWidth}
      textColor={textColor}
      textSize={textSize}
      toggleCellEditMode={toggleCellEditMode}
      value={getCellText(value, columnType, displayText)}
      verticalAlignment={verticalAlignment}
    />
  );
}
