import { Colors } from "constants/Colors";
import { isNil } from "lodash";
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import type { InputHTMLType } from "widgets/BaseInputWidget/component";
import BaseInputComponent from "widgets/BaseInputWidget/component";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import type { EditableCell } from "widgets/TableWidgetV2/constants";
import type { VerticalAlignment } from "../Constants";
import { EDITABLE_CELL_PADDING_OFFSET, TABLE_SIZES } from "../Constants";
import {
  getLocaleDecimalSeperator,
  getLocaleThousandSeparator,
} from "widgets/WidgetUtils";
import { limitDecimalValue } from "widgets/CurrencyInputWidget/component/utilities";
import { getLocale } from "utils/helpers";
import { appsmithTelemetry } from "instrumentation";

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
      height: ${(props) =>
        TABLE_SIZES[props.compactMode].EDITABLE_CELL_HEIGHT}px;
      min-height: ${(props) =>
        TABLE_SIZES[props.compactMode].EDITABLE_CELL_HEIGHT}px;
      font-size: ${(props) => props.textSize};
    }

    .currency-change-dropdown-trigger {
      border: none;
      height: ${(props) =>
        TABLE_SIZES[props.compactMode].EDITABLE_CELL_HEIGHT}px;
      padding: 0 0 0 5px;
      margin-right: 0;
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

function convertToNumber(inputValue: string) {
  inputValue = inputValue.replace(
    new RegExp(`[${getLocaleDecimalSeperator()}]`),
    ".",
  );

  const parsedValue = Number(inputValue);

  if (isNaN(parsedValue) || inputValue.trim() === "" || isNil(inputValue)) {
    return null;
  } else if (Number.isFinite(parsedValue)) {
    return parsedValue;
  } else {
    return null;
  }
}

interface InlineEditorPropsType {
  accentColor: string;
  compactMode: string;
  inputType: InputTypes;
  inputHTMLType: InputHTMLType;
  multiline: boolean;
  onChange: (value: EditableCell["value"], inputValue: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
  isEditableCellValid: boolean;
  validationErrorMessage: string;
  widgetId: string;
  paddedInput: boolean;
  autoFocus: boolean;
  additionalProps: Record<string, unknown>;
}

export function InlineCellEditor({
  accentColor,
  additionalProps = {},
  allowCellWrapping,
  autoFocus,
  compactMode,
  inputHTMLType,
  inputType = InputTypes.TEXT,
  isEditableCellValid,
  multiline,
  onChange,
  onDiscard,
  onSave,
  textSize,
  validationErrorMessage,
  value,
  verticalAlignment,
  widgetId,
}: InlineEditorPropsType) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const [cursorPos, setCursorPos] = useState(value.length);

  const onFocusChange = useCallback(
    (focus: boolean) => {
      !focus && onSave();
      setHasFocus(focus);
    },
    [onSave],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { key } = event;

      switch (key) {
        case "Escape":
          onDiscard();
          break;
        case "Enter":
          if (!event.shiftKey) {
            onSave();
            event.preventDefault();
          }

          break;
      }
    },
    [onDiscard, onSave],
  );

  const onTextChange = useCallback(
    (inputValue: string) => {
      setCursorPos(inputRef.current?.selectionStart);

      let value: EditableCell["value"] = inputValue;

      if (inputType === InputTypes.NUMBER) {
        value = convertToNumber(inputValue);
      } else if (inputType === InputTypes.CURRENCY) {
        const decimalSeperator = getLocaleDecimalSeperator();

        try {
          if (inputValue && inputValue.includes(decimalSeperator)) {
            inputValue = limitDecimalValue(
              additionalProps.decimals as number,
              inputValue,
            );
          }

          value = convertToNumber(inputValue);
        } catch (e) {
          appsmithTelemetry.captureException(e, {
            errorName: "TableWidgetV2_InlineCellEditor",
          });
        }
      }

      onChange(value, inputValue);
    },
    [setCursorPos, onChange, inputType],
  );

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.selectionStart = cursorPos;

      if (cursorPos < value.length) {
        inputRef.current.selectionEnd = cursorPos;
      }
    }
  }, [multiline]);

  const parsedValue = useMemo(() => {
    if (inputType === InputTypes.CURRENCY && typeof value === "number") {
      return Intl.NumberFormat(getLocale(), {
        style: "decimal",
        minimumFractionDigits: additionalProps.decimals as number,
        maximumFractionDigits: additionalProps.decimals as number,
      })
        .format(value)
        .replaceAll(getLocaleThousandSeparator(), "");
    } else {
      return value;
    }
  }, [value]);

  return (
    <Wrapper
      accentColor={accentColor}
      allowCellWrapping={allowCellWrapping}
      className={`${hasFocus ? FOCUS_CLASS : ""} t--inlined-cell-editor ${
        !isEditableCellValid && "t--inlined-cell-editor-has-error"
      }`}
      compactMode={compactMode}
      isEditableCellValid={isEditableCellValid}
      paddedInput
      textSize={textSize}
      verticalAlignment={verticalAlignment}
    >
      <BaseInputComponent
        accentColor={accentColor}
        autoFocus={hasFocus || autoFocus}
        compactMode
        disableNewLineOnPressEnterKey={false}
        errorMessage={validationErrorMessage}
        errorTooltipBoundary={`#table${widgetId} .tableWrap`}
        inputHTMLType={inputHTMLType}
        inputRef={inputRef}
        inputType={inputType}
        isInvalid={hasFocus && !isEditableCellValid}
        isLoading={false}
        label=""
        multiline={multiline}
        onFocusChange={onFocusChange}
        onKeyDown={onKeyDown}
        onValueChange={onTextChange}
        showError
        value={parsedValue}
        widgetId=""
        {...additionalProps}
      />
    </Wrapper>
  );
}
