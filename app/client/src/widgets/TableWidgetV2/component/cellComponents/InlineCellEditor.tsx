import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import BaseInputComponent from "widgets/BaseInputWidget/component";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { TABLE_SIZES, VerticalAlignment } from "../Constants";

const Wrapper = styled.div<{
  accentColor: string;
  compactMode: string;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
}>`
  padding: 1px;
  border: 1px solid ${(props) => props.accentColor};
  background: #fff;
  position: absolute;
  width: 100%;
  left: 0;
  overflow: hidden;
  height: ${(props) =>
    props.allowCellWrapping
      ? `100%`
      : `${TABLE_SIZES[props.compactMode].ROW_HEIGHT}px`};
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
      padding: 0px 8px;
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
        padding-top: ${(props) =>
          TABLE_SIZES[props.compactMode].VERTICAL_PADDING}px;
      }
    }

    .text-input-wrapper {
      height: calc(100% + 4px);
      border: none;
      box-shadow: none !important;
    }
  }
`;

type InlineEditorPropsType = {
  accentColor: string;
  compactMode: string;
  inputType: InputTypes.TEXT | InputTypes.NUMBER;
  multiline: boolean;
  onChange: (text: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  value: any;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
};

export function InlineCellEditor({
  accentColor,
  compactMode,
  inputType = InputTypes.TEXT,
  multiline,
  onChange,
  onDiscard,
  onSave,
  textSize,
  value,
  allowCellWrapping,
  verticalAlignment,
}: InlineEditorPropsType) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [cursorPos, setCursorPos] = useState(value.length);
  const onFocusChange = useCallback((focus: boolean) => !focus && onSave(), [
    onSave,
  ]);

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
    (data: string) => {
      setCursorPos(inputRef.current?.selectionStart);
      onChange(data);
    },
    [setCursorPos, onChange],
  );

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = cursorPos;

        if (cursorPos < value.length) {
          inputRef.current.selectionEnd = cursorPos;
        }
      }
    }, 0);
  }, [cursorPos, inputRef.current, value]);

  return (
    <Wrapper
      accentColor={accentColor}
      allowCellWrapping={allowCellWrapping}
      className="t--inlined-cell-editor"
      compactMode={compactMode}
      textSize={textSize}
      verticalAlignment={verticalAlignment}
    >
      <BaseInputComponent
        accentColor={accentColor}
        autoFocus
        compactMode
        disableNewLineOnPressEnterKey={false}
        inputHTMLType={inputType}
        inputRef={inputRef}
        inputType={inputType}
        isInvalid={false}
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
