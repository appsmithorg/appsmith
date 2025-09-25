import React, { useMemo, useRef, useState } from "react";
import type { VerticalAlignment } from "../Constants";
import {
  ALIGN_ITEMS,
  EDITABLE_CELL_PADDING_OFFSET,
  TABLE_SIZES,
} from "../Constants";
import DateComponent from "widgets/DatePickerWidget2/component";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";
import type { RenderDefaultPropsType } from "./PlainTextCell";
import styled from "styled-components";
import {
  DateInputFormat,
  EditableCellActions,
  MomentDateInputFormat,
} from "widgets/TableWidgetV2/constants";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import moment from "moment";
import { BasicCell } from "./BasicCell";
import { Colors } from "constants/Colors";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import {
  createMessage,
  INPUT_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "ee/constants/messages";

type DateComponentProps = RenderDefaultPropsType &
  editPropertyType & {
    accentColor?: string;
    borderRadius?: string;
    boxShadow?: string;
    closeOnSelection: boolean;
    maxDate: string;
    minDate: string;
    onDateChange?: string;
    shortcuts: boolean;
    timePrecision: TimePrecision;
    inputFormat: string;
    outputFormat: string;
    onDateSave: (
      rowIndex: number,
      alias: string,
      value: string,
      onSubmit?: string,
    ) => void;
    onDateSelectedString: string;
    firstDayOfWeek?: number;
    isRequired: boolean;
    updateNewRowValues: (
      alias: string,
      value: unknown,
      parsedValue: unknown,
    ) => void;
  };

const COMPONENT_DEFAULT_VALUES = {
  maxDate: "2121-12-31T18:29:00.000Z",
  minDate: "1920-12-31T18:30:00.000Z",
  timePrecision: TimePrecision.MINUTE,
};

interface editPropertyType {
  alias: string;
  onDateSelectedString: string;
  rowIndex: number;
}

const DEFAULT_BORDER_RADIUS = "0";

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

const FOCUS_CLASS = "has-focus";

const Wrapper = styled.div<{
  accentColor: string;
  compactMode: string;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
  isEditableCellValid: boolean;
  paddedInput: boolean;
}>`
  padding: 1px;
  border: 1px solid
    ${(props) => (!props.isEditableCellValid ? Colors.DANGER_SOLID : "#fff")};
  background: #fff;
  position: absolute;
  width: ${(props) =>
    props.paddedInput
      ? `calc(100% - ${EDITABLE_CELL_PADDING_OFFSET}px)`
      : "100%"};
  left: 50%;
  transform: translate(-50%, 0);
  overflow: hidden;
  border-radius: 3px;
  display: flex;
  height: ${(props) => {
    if (props.allowCellWrapping) {
      return props.paddedInput
        ? `calc(100% - ${EDITABLE_CELL_PADDING_OFFSET}px)`
        : "100%";
    } else {
      return props.paddedInput
        ? `${
            TABLE_SIZES[props.compactMode].ROW_HEIGHT -
            EDITABLE_CELL_PADDING_OFFSET
          }px`
        : `${TABLE_SIZES[props.compactMode].ROW_HEIGHT}px`;
    }
  }};
  ${(props) => {
    switch (props.verticalAlignment) {
      case "TOP":
        return `top: 0;`;
      case "BOTTOM":
        return `bottom: 0;`;
      case "CENTER":
        return `
            top: calc(50% - (${TABLE_SIZES[props.compactMode].ROW_HEIGHT}/2)px);
          `;
    }
  }}

  &&&&& {
    .bp3-input,
    .bp3-input:focus {
      border: none;
      /*
        * using !important since underlying
        * component styles has !important
      */
      box-shadow: none !important;
      padding: 0px 5px 0px 6px;
      font-size: ${(props) => props.textSize};
      background: transparent;
      color: inherit;
    }
  }

  &.${FOCUS_CLASS} {
    ${(props) =>
      props.isEditableCellValid && `border: 1px solid ${props.accentColor}`}
  }
`;

export const DateCell = (props: DateComponentProps) => {
  const {
    accentColor,
    alias,
    allowCellWrapping,
    borderRadius,
    cellBackground,
    columnType,
    compactMode,
    disabledEditIcon,
    disabledEditIconMessage,
    firstDayOfWeek,
    fontStyle,
    hasUnsavedChanges,
    horizontalAlignment,
    inputFormat,
    isCellDisabled,
    isCellEditable,
    isCellEditMode,
    isCellVisible,
    isEditableCellValid,
    isHidden,
    isNewRow,
    isRequired,
    maxDate,
    minDate,
    onDateSave,
    onDateSelectedString,
    outputFormat,
    rowIndex,
    shortcuts,
    tableWidth,
    textColor,
    textSize,
    timePrecision,
    toggleCellEditMode,
    updateNewRowValues,
    validationErrorMessage,
    value,
    verticalAlignment,
    widgetId,
  } = props;

  const [hasFocus, setHasFocus] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [showRequiredError, setShowRequiredError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const convertInputFormatToMomentFormat = (inputFormat: string) => {
    let momentAdjustedInputFormat = inputFormat;

    if (inputFormat === DateInputFormat.MILLISECONDS) {
      momentAdjustedInputFormat = MomentDateInputFormat.MILLISECONDS;
    } else if (inputFormat === DateInputFormat.EPOCH) {
      momentAdjustedInputFormat = MomentDateInputFormat.SECONDS;
    }

    return momentAdjustedInputFormat;
  };

  const isCellCompletelyValid = useMemo(
    () => isEditableCellValid && isValid,
    [isEditableCellValid, isValid],
  );

  const valueInISOFormat = useMemo(() => {
    if (typeof value !== "string") return "";

    if (moment(value, ISO_DATE_FORMAT, true).isValid()) {
      return value;
    }

    const valueInSelectedFormat = moment(value, props.outputFormat, true);

    if (valueInSelectedFormat.isValid()) {
      return valueInSelectedFormat.format(ISO_DATE_FORMAT);
    }

    return value;
  }, [value, props.outputFormat]);

  const onDateSelected = (date: string) => {
    const momentAdjustedInputFormat =
      convertInputFormatToMomentFormat(inputFormat);

    const formattedDate = date
      ? moment(date).format(momentAdjustedInputFormat)
      : "";

    if (isNewRow) {
      updateNewRowValues(alias, date, formattedDate);

      return;
    }

    if (isRequired && !date) {
      setIsValid(false);
      setShowRequiredError(true);

      return;
    }

    setIsValid(true);
    setShowRequiredError(false);
    setHasFocus(false);

    onDateSave(rowIndex, alias, formattedDate, onDateSelectedString);
  };

  const onDateCellEdit = () => {
    setHasFocus(true);

    if (isRequired && !value) {
      setIsValid(false);
      setShowRequiredError(true);
    }

    toggleCellEditMode(true, rowIndex, alias, value);
  };

  const onPopoverClosed = () => {
    setHasFocus(false);
    setIsValid(true);
    toggleCellEditMode(
      false,
      rowIndex,
      alias,
      value,
      "",
      EditableCellActions.DISCARD,
    );
  };

  const onDateOutOfRange = () => {
    setIsValid(false);
    setShowRequiredError(false);
  };

  const onDateInputFocus = () => {
    if (isNewRow) {
      setHasFocus(true);
    }
  };

  let editor;

  if (isCellEditMode) {
    editor = (
      <Wrapper
        accentColor={accentColor}
        allowCellWrapping={allowCellWrapping}
        className={`${hasFocus ? FOCUS_CLASS : ""} t--inlined-cell-editor ${
          !isCellCompletelyValid && "t--inlined-cell-editor-has-error"
        }`}
        compactMode={compactMode}
        isEditableCellValid={isCellCompletelyValid}
        paddedInput
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      >
        <ErrorTooltip
          isOpen={showRequiredError && !isCellCompletelyValid}
          message={
            validationErrorMessage ||
            createMessage(INPUT_WIDGET_DEFAULT_VALIDATION_ERROR)
          }
        >
          <DateComponent
            accentColor={accentColor}
            borderRadius={borderRadius || DEFAULT_BORDER_RADIUS}
            closeOnSelection
            compactMode
            dateFormat={outputFormat}
            datePickerType="DATE_PICKER"
            firstDayOfWeek={firstDayOfWeek}
            isDisabled={!isNewRow}
            isLoading={false}
            /*
             * Reason for using `undefined`
             * https://github.com/appsmithorg/appsmith/pull/19181#discussion_r1066871100
             **/
            isPopoverOpen={isNewRow ? undefined : true}
            labelText=""
            maxDate={maxDate || COMPONENT_DEFAULT_VALUES.maxDate}
            minDate={minDate || COMPONENT_DEFAULT_VALUES.minDate}
            onDateOutOfRange={onDateOutOfRange}
            onDateSelected={onDateSelected}
            onFocus={onDateInputFocus}
            onPopoverClosed={onPopoverClosed}
            selectedDate={valueInISOFormat}
            shortcuts={shortcuts}
            timePrecision={
              timePrecision || COMPONENT_DEFAULT_VALUES.timePrecision
            }
            widgetId={widgetId}
          />
        </ErrorTooltip>
      </Wrapper>
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
        onEdit={onDateCellEdit}
        ref={contentRef}
        tableWidth={tableWidth}
        textColor={textColor}
        textSize={textSize}
        value={value}
        verticalAlignment={verticalAlignment}
      />
      {editor}
    </Container>
  );
};
