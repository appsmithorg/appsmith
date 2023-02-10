import { Colors } from "constants/Colors";
import { isNil } from "lodash";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import BaseInputComponent from "widgets/BaseInputWidget/component";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { EditableCell } from "widgets/TableWidgetV2/constants";
import {
  EDITABLE_CELL_PADDING_OFFSET,
  TABLE_SIZES,
  VerticalAlignment,
} from "../Constants";

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

type InlineEditorPropsType = {
  accentColor: string;
  compactMode: string;
  inputType: InputTypes.TEXT | InputTypes.NUMBER;
  multiline: boolean;
  onChange: (value: EditableCell["value"], inputValue: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  value: any;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
  isEditableCellValid: boolean;
  validationErrorMessage: string;
  widgetId: string;
  paddedInput: boolean;
  autoFocus: boolean;
};

export function InlineCellEditor({
  accentColor,
  autoFocus,
  compactMode,
  inputType = InputTypes.TEXT,
  isEditableCellValid,
  multiline,
  onChange,
  onDiscard,
  onSave,
  textSize,
  value,
  allowCellWrapping,
  verticalAlignment,
  validationErrorMessage,
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
        const parsedValue = Number(inputValue);

        if (
          isNaN(parsedValue) ||
          inputValue.trim() === "" ||
          isNil(inputValue)
        ) {
          value = null;
        } else if (Number.isFinite(parsedValue)) {
          value = parsedValue;
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

  return (
    <Wrapper
      accentColor={accentColor}
      allowCellWrapping={allowCellWrapping}
      className={`${
        hasFocus ? FOCUS_CLASS : ""
      } t--inlined-cell-editor ${!isEditableCellValid &&
        "t--inlined-cell-editor-has-error"}`}
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
        inputHTMLType={inputType}
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
        value={value}
        widgetId=""
      />
    </Wrapper>
  );
}
