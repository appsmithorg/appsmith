import React from "react";
import { isNumber, isNil } from "lodash";

import { ColumnTypes, CellLayoutProperties } from "../Constants";
import { InlineCellEditor } from "../cellComponents/InlineCellEditor";
import { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { TextCell } from "../cellComponents/TextCell";

export type renderDefaultPropsType = {
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

export const renderDefault = (props: renderDefaultPropsType) => {
  const {
    cellProperties,
    columnType,
    isCellEditable,
    isCellEditMode,
    isCellVisible,
    isHidden,
    onCellTextChange,
    tableWidth,
    toggleCellEditMode,
    value,
  } = props;

  let cell;

  if (isCellEditMode) {
    cell = (
      <InlineCellEditor
        onChange={(text: string) => onCellTextChange(text)}
        onDiscard={() => toggleCellEditMode(false, EditableCellActions.DISCARD)}
        onSave={() => toggleCellEditMode(false, EditableCellActions.SAVE)}
        value={value}
      />
    );
  } else {
    cell = (
      <TextCell
        cellProperties={cellProperties}
        columnType={columnType}
        isCellEditable={isCellEditable}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        ref={ref}
        tableWidth={tableWidth}
        toggleCellEditMode={toggleCellEditMode}
        value={getCellText(value, cellProperties, columnType)}
      />
    );
  }

  return cell;
};
