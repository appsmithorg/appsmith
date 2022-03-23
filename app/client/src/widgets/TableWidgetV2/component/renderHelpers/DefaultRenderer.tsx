import React from "react";
import { isNumber, isNil } from "lodash";

import { ColumnTypes, CellLayoutProperties } from "../Constants";
import { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { TextCell } from "../cellComponents/TextCell";

export type RenderDefaultPropsType = {
  compactMode: string;
  value: any;
  columnType: string;
  isHidden: boolean;
  cellProperties: CellLayoutProperties;
  tableWidth: number;
  isCellEditable: boolean;
  isCellVisible: boolean;
  isCellEditMode?: boolean;
  onCellTextChange: (data: string) => void;
  toggleCellEditMode: (editMode: boolean, action?: EditableCellActions) => void;
};

export function getCellText(
  value: any,
  cellProperties: CellLayoutProperties,
  columnType: string,
) {
  let text;

  if (value && columnType === ColumnTypes.URL && cellProperties.displayText) {
    text = cellProperties.displayText;
  } else if (!isNil(value) && (!isNumber(value) || !isNaN(value))) {
    text = value.toString();
  } else {
    text = "";
  }

  return text;
}

export const renderDefault = (props: RenderDefaultPropsType) => {
  const {
    cellProperties,
    columnType,
    compactMode,
    isCellEditable,
    isCellEditMode,
    isCellVisible,
    isHidden,
    onCellTextChange,
    tableWidth,
    toggleCellEditMode,
    value,
  } = props;

  return (
    <TextCell
      cellProperties={cellProperties}
      columnType={columnType}
      compactMode={compactMode}
      isCellEditMode={isCellEditMode}
      isCellEditable={isCellEditable}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      onCellTextChange={onCellTextChange}
      onChange={(text: string) => onCellTextChange(text)}
      onDiscard={() => toggleCellEditMode(false, EditableCellActions.DISCARD)}
      onSave={() => toggleCellEditMode(false, EditableCellActions.SAVE)}
      tableWidth={tableWidth}
      toggleCellEditMode={toggleCellEditMode}
      value={getCellText(value, cellProperties, columnType)}
    />
  );
};
