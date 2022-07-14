import React, { memo, useMemo } from "react";
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
import { TextCell } from "./TextCell";
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
  toggleCellEditMode: (
    enable: boolean,
    rowIndex: number,
    alias: string,
    value: string | number,
    onSubmit: string,
    action: EditableCellActions,
  ) => void;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  cellBackground?: string;
  hasUnsavedChanged?: boolean;
  horizontalAlignment?: CellAlignment;
  textColor?: string;
  displayText?: string;
  fontStyle?: string;
  textSize?: string;
};

type editPropertyType = {
  alias: string;
  onSubmitString: string;
  rowIndex: number;
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

function DefaultCell(props: RenderDefaultPropsType & editPropertyType) {
  const {
    alias,
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
    onSubmitString,
    rowIndex,
    tableWidth,
    textColor,
    textSize,
    toggleCellEditMode,
    value,
    verticalAlignment,
  } = props;

  const editEvents = useMemo(
    () => ({
      onChange: (text: string) => onCellTextChange(text),
      onDiscard: () =>
        toggleCellEditMode(
          false,
          rowIndex,
          alias,
          value,
          onSubmitString,
          EditableCellActions.DISCARD,
        ),
      onEdit: () =>
        toggleCellEditMode(
          true,
          rowIndex,
          alias,
          value,
          onSubmitString,
          EditableCellActions.SAVE,
        ),
      onSave: () =>
        toggleCellEditMode(
          false,
          rowIndex,
          alias,
          value,
          onSubmitString,
          EditableCellActions.SAVE,
        ),
    }),
    [onCellTextChange, toggleCellEditMode, value],
  );

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
      onChange={editEvents.onChange}
      onDiscard={editEvents.onDiscard}
      onEdit={editEvents.onEdit}
      onSave={editEvents.onSave}
      tableWidth={tableWidth}
      textColor={textColor}
      textSize={textSize}
      toggleCellEditMode={toggleCellEditMode}
      value={getCellText(value, columnType, displayText)}
      verticalAlignment={verticalAlignment}
    />
  );
}

export default memo(DefaultCell);
