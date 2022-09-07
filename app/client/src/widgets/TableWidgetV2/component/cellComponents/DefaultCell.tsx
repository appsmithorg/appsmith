import React, { memo, useMemo } from "react";
import { isNumber, isNil } from "lodash";

import { BaseCellComponentProps } from "../Constants";
import {
  ColumnTypes,
  EditableCell,
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
  onCellTextChange: (value: EditableCell["value"], inputValue: string) => void;
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
  isEditableCellValid: boolean;
  validationErrorMessage: string;
  widgetId: string;
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
    isEditableCellValid,
    isHidden,
    onCellTextChange,
    onDiscardString,
    onSubmitString,
    rowIndex,
    tableWidth,
    textColor,
    textSize,
    toggleCellEditMode,
    validationErrorMessage,
    value,
    verticalAlignment,
    widgetId,
  } = props;

  const editEvents = useMemo(
    () => ({
      onChange: onCellTextChange,
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
      isEditableCellValid,
      validationErrorMessage,
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
      isEditableCellValid={isEditableCellValid}
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
      validationErrorMessage={validationErrorMessage}
      value={getCellText(value, columnType, displayText)}
      verticalAlignment={verticalAlignment}
      widgetId={widgetId}
    />
  );
}

export default memo(DefaultCell);
