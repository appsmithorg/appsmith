import React, {
  memo,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isNumber, isNil } from "lodash";

import {
  ALIGN_ITEMS,
  BaseCellComponentProps,
  VerticalAlignment,
} from "../Constants";
import {
  ColumnTypes,
  EditableCell,
  EditableCellActions,
} from "widgets/TableWidgetV2/constants";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { CELL_WRAPPER_LINE_HEIGHT } from "../TableStyledWrappers";
import { BasicCell } from "./BasicCell";
import { InlineCellEditor } from "./InlineCellEditor";
import styled from "styled-components";
import fastdom from "fastdom";

const Container = styled.div<{
  isCellEditMode?: boolean;
  verticalAlignment?: VerticalAlignment;
  cellBackground?: string;
}>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: ${(props) =>
    props.verticalAlignment && ALIGN_ITEMS[props.verticalAlignment]};
`;

export type RenderDefaultPropsType = BaseCellComponentProps & {
  accentColor: string;
  value: any;
  columnType: string;
  tableWidth: number;
  isCellEditable: boolean;
  isCellEditMode?: boolean;
  onCellTextChange: (
    value: EditableCell["value"],
    inputValue: string,
    alias: string,
  ) => void;
  toggleCellEditMode: (
    enable: boolean,
    rowIndex: number,
    alias: string,
    value: string | number,
    onSubmit?: string,
    action?: EditableCellActions,
  ) => void;
  hasUnsavedChanges?: boolean;
  displayText?: string;
  disabledEditIcon: boolean;
  isEditableCellValid: boolean;
  validationErrorMessage: string;
  widgetId: string;
  disabledEditIconMessage: string;
  isNewRow: boolean;
};

type editPropertyType = {
  alias: string;
  onSubmitString: string;
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

function getContentHeight(ref: RefObject<HTMLDivElement>) {
  return (
    !!ref.current?.offsetHeight &&
    ref.current?.offsetHeight / CELL_WRAPPER_LINE_HEIGHT > 1
  );
}

function PlainTextCell(props: RenderDefaultPropsType & editPropertyType) {
  const {
    accentColor,
    alias,
    allowCellWrapping,
    cellBackground,
    columnType,
    compactMode,
    disabledEditIcon,
    disabledEditIconMessage,
    displayText,
    fontStyle,
    hasUnsavedChanges,
    horizontalAlignment,
    isCellDisabled,
    isCellEditable,
    isCellEditMode,
    isCellVisible,
    isEditableCellValid,
    isHidden,
    isNewRow,
    onCellTextChange,
    onSubmitString,
    rowIndex,
    tableWidth,
    textColor,
    textSize,
    toggleCellEditMode,
    validationErrorMessage,
    verticalAlignment,
    widgetId,
  } = props;

  let value = props.value;

  const editEvents = useMemo(
    () => ({
      onChange: (value: EditableCell["value"], inputValue: string) =>
        onCellTextChange(value, inputValue, alias),
      onDiscard: () =>
        toggleCellEditMode(
          false,
          rowIndex,
          alias,
          value,
          "",
          EditableCellActions.DISCARD,
        ),
      onEdit: () => toggleCellEditMode(true, rowIndex, alias, value),
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
      onSubmitString,
    ],
  );

  value = getCellText(value, columnType, displayText);

  const contentRef = useRef<HTMLDivElement>(null);

  let editor;

  const [isMultiline, setIsMultiline] = useState(false);

  useEffect(() => {
    if (isCellEditMode) {
      fastdom.measure(() => {
        setIsMultiline(getContentHeight(contentRef));
      });
    }
  }, [value, isCellEditMode]);

  if (isCellEditMode) {
    editor = (
      <InlineCellEditor
        accentColor={accentColor}
        allowCellWrapping={allowCellWrapping}
        autoFocus={!isNewRow}
        compactMode={compactMode}
        inputType={
          columnType === ColumnTypes.NUMBER
            ? InputTypes.NUMBER
            : InputTypes.TEXT
        }
        isEditableCellValid={isEditableCellValid}
        multiline={isMultiline}
        onChange={editEvents.onChange}
        onDiscard={editEvents.onDiscard}
        onSave={editEvents.onSave}
        paddedInput={isNewRow}
        textSize={textSize}
        validationErrorMessage={validationErrorMessage}
        value={value}
        verticalAlignment={verticalAlignment}
        widgetId={widgetId}
      />
    );
  }

  return (
    <Container
      cellBackground={cellBackground}
      className="t--table-text-cell"
      isCellEditMode={isCellEditMode}
      verticalAlignment={verticalAlignment}
    >
      <BasicCell
        accentColor={accentColor}
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        columnType={columnType}
        compactMode={compactMode}
        disabledEditIcon={disabledEditIcon}
        disabledEditIconMessage={disabledEditIconMessage}
        fontStyle={fontStyle}
        hasUnsavedChanges={hasUnsavedChanges}
        horizontalAlignment={horizontalAlignment}
        isCellDisabled={isCellDisabled}
        isCellEditMode={isCellEditMode}
        isCellEditable={isCellEditable}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        onEdit={editEvents.onEdit}
        ref={contentRef}
        tableWidth={tableWidth}
        textColor={textColor}
        textSize={textSize}
        url={columnType === ColumnTypes.URL ? props.value : null}
        value={value}
        verticalAlignment={verticalAlignment}
      />
      {editor}
    </Container>
  );
}

export default memo(PlainTextCell);
