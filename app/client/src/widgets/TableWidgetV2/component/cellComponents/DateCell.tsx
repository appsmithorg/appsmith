import React, {
  FocusEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ALIGN_ITEMS,
  VerticalAlignment,
  EDITABLE_CELL_PADDING_OFFSET,
  TABLE_SIZES,
} from "../Constants";
import DateComponent from "widgets/DatePickerWidget2/component";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";
// import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import { RenderDefaultPropsType } from "./PlainTextCell";
// import { Colors } from "constants/Colors";
import styled from "styled-components";
import {
  ColumnTypes,
  EditableCell,
  EditableCellActions,
} from "widgets/TableWidgetV2/constants";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import moment from "moment";
import { BasicCell } from "./BasicCell";
import { InlineCellEditor } from "./InlineCellEditor";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { Colors } from "constants/Colors";
import { setEvalPopupState } from "actions/editorContextActions";

type DateComponentProps = RenderDefaultPropsType &
  editPropertyType & {
    accentColor?: string;
    borderRadius?: string;
    boxShadow?: string;
    closeOnSelection: boolean;
    convertToISO: boolean;
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
    onDateSelection: (rowIndex: number, onDateSelected: string) => void;
    onDateSelectedString: string;
    // firstDayOfWeek?: number;
  };

const COMPONENT_DEFAULT_VALUES = {
  //   closeOnSelection: false,
  //   convertToISO: false,
  //   dateFormat: "YYYY-MM-DD HH:mm",
  //   isDisabled: false,
  //   isRequired: false,
  //   isVisible: true,
  //   label: "",
  maxDate: "2121-12-31T18:29:00.000Z",
  minDate: "1920-12-31T18:30:00.000Z",
  //   shortcuts: false,
  //   timePrecision: TimePrecision.MINUTE,
  //   labelTextSize: THEMEING_TEXT_SIZES.sm,
};

type editPropertyType = {
  alias: string;
  onSubmitString: string;
  rowIndex: number;
};

// const DEFAULT_PRIMARY_COLOR = Colors.GREEN;
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
  height: ${(props) => {
    if (props.allowCellWrapping) {
      return props.paddedInput
        ? `calc(100% - ${EDITABLE_CELL_PADDING_OFFSET}px)`
        : "100%";
    } else {
      return props.paddedInput
        ? `${TABLE_SIZES[props.compactMode].ROW_HEIGHT -
            EDITABLE_CELL_PADDING_OFFSET}px`
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
      min-height: 34px;
      font-size: ${(props) => props.textSize};
    }
    .bp3-button-group.bp3-vertical {
      display: none;
    }

    textarea.bp3-input {
      &,
      &:focus {
        line-height: 28px;
        padding: ${(props) =>
            TABLE_SIZES[props.compactMode].VERTICAL_EDITOR_PADDING}px
          6px 0px 6px;
      }
    }

    .text-input-wrapper {
      height: calc(100% + 4px);
      border: none;
      box-shadow: none !important;
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
    // firstDayOfWeek,
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
    maxDate,
    minDate,
    onCellTextChange,
    onDateSave,
    onDateSelectedString,
    onDateSelection,
    onSubmitString,
    outputFormat,
    rowIndex,
    tableWidth,
    textColor,
    textSize,
    timePrecision,
    toggleCellEditMode,
    validationErrorMessage,
    verticalAlignment,
    widgetId,
  } = props;

  const [hasFocus, setHasFocus] = useState(false);

  const value = props.value;
  const [date, setDate] = useState(value);
  const [isBlur, setIsBlur] = useState(false);

  useEffect(() => {
    // if (!hasFocus) {
    //   editEvents.onDiscard();
    // }
    console.log("datatree hasFocus", hasFocus);
  }, [hasFocus]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  // const inputRef = useRef<HTMLInputElement>(null);

  const editEvents = useMemo(
    () => ({
      onChange: (date: string) => onCellTextChange(date, date, alias),
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
          date,
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

  const contentRef = useRef<HTMLDivElement>(null);

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

  // useEffect(() => {
  //   if (isCellEditMode) {
  //     toggleCellEditMode(true, rowIndex, alias, value);
  //   }
  // }, [isCellEditMode]);

  const onDateSelected = (date: string) => {
    const formattedDate = moment(date).format(inputFormat);
    onDateSelection(rowIndex, onDateSelectedString);
    onDateSave(rowIndex, alias, formattedDate, onSubmitString);
    onBlur(null, true);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // const { key } = event;
    // switch (key) {
    //   case "Escape":
    //     editEvents.onDiscard();
    //     break;
    //   case "Enter":
    //     if (!event.shiftKey) {
    //       editEvents.onSave();
    //       event.preventDefault();
    //     }
    //     break;
    // }
  };

  const onDateCellEdit = () => {
    setHasFocus(true);
    // inputRef.current?.click();
    editEvents.onEdit();
  };

  const onBlur = (e: any, flag: boolean) => {
    // console.log("datatree onBlur 328", e);
    if (flag || isBlur) {
      editEvents.onDiscard();
      setIsBlur(false);
    }
  };

  let editor;

  if (isCellEditMode) {
    editor = (
      <Wrapper
        accentColor={accentColor}
        allowCellWrapping={allowCellWrapping}
        className={`${
          hasFocus ? FOCUS_CLASS : ""
        } t--inlined-cell-editor ${!isEditableCellValid &&
          "t--inlined-cell-editor-has-error"}`}
        compactMode={compactMode}
        isEditableCellValid={isEditableCellValid}
        onBlur={(e) => onBlur(e, false)}
        // onFocus={() => console.log("datatree wrapper focusss")}
        onKeyDown={onKeyDown}
        paddedInput
        ref={wrapperRef}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      >
        <DateComponent
          accentColor={accentColor}
          borderRadius={borderRadius || DEFAULT_BORDER_RADIUS}
          closeOnSelection
          compactMode
          dateFormat={outputFormat}
          datePickerType="DATE_PICKER"
          // inputRef={inputRef}
          // firstDayOfWeek={firstDayOfWeek || 0}
          isDisabled={!!isCellDisabled}
          isLoading={false}
          labelText=""
          maxDate={maxDate || COMPONENT_DEFAULT_VALUES.maxDate}
          minDate={minDate || COMPONENT_DEFAULT_VALUES.minDate}
          // onBlur={() => console.log("datatree datecomponent blur")}
          // onBlur={() => console.log("datatree datecomponent blurrr")}
          onDateSelected={onDateSelected}
          // onFocus={() => console.log("datatree datecomponent focus")}
          // onSave={editEvents.onSave}
          // paddedInput={isNewRow}
          selectedDate={valueInISOFormat}
          shortcuts
          timePrecision={TimePrecision.MINUTE}
          // textSize={textSize}
          // validationErrorMessage={validationErrorMessage}
          // value={value}
          // verticalAlignment={verticalAlignment}
          widgetId={"adsasd"}
        />
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
        url={columnType === ColumnTypes.URL ? props.value : null}
        value={value}
        verticalAlignment={verticalAlignment}
      />
      {editor}
    </Container>
  );
};
