import React, { memo, useMemo } from "react";
import { isNumber, isNil } from "lodash";

import { BaseCellComponentProps } from "../Constants";
import {
  ColumnTypes,
  EditableCellActions,
} from "widgets/TableWidgetV2/constants";
import { TextCell } from "./TextCell";

export type RenderDefaultPropsType = BaseCellComponentProps & {
  accentColor: string;
  value: any;
  columnType: string;
  tableWidth: number;
  isCellEditable: boolean;
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
  hasUnsavedChanged?: boolean;
  displayText?: string;
  disabledEditIcon: boolean;
};

type editPropertyType = {
  alias: string;
  onSubmitString: string;
  onDiscardString: string;
  rowIndex: number;
};

export function getCellText(
  value: unknown,
  columnType: string,
  displayText?: string,
) {
  let text;

  if (value && columnType === ColumnTypes.URL && displayText) {
    text = displayText;
  } else if (!isNil(value) && (!isNumber(value) || !isNaN(value))) {
    text = (value as string).toString();
  } else {
    text = "";
  }

  return text;
}

function DefaultCell(props: RenderDefaultPropsType & editPropertyType) {
  const {
    accentColor,
    alias,
    allowCellWrapping,
    cellBackground,
    columnType,
    compactMode,
    disabledEditIcon,
    displayText,
    fontStyle,
    hasUnsavedChanged,
    horizontalAlignment,
    isCellEditable,
    isCellEditMode,
    isCellVisible,
    isHidden,
    onCellTextChange,
    onDiscardString,
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
          onDiscardString,
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
    [
      onCellTextChange,
      toggleCellEditMode,
      value,
      rowIndex,
      alias,
      onDiscardString,
      onSubmitString,
    ],
  );

  return (
    <TextCell
      accentColor={accentColor}
      allowCellWrapping={allowCellWrapping}
      cellBackground={cellBackground}
      columnType={columnType}
      compactMode={compactMode}
      disabledEditIcon={disabledEditIcon}
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
