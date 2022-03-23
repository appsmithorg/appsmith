import { Colors } from "constants/Colors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import BaseInputComponent from "widgets/BaseInputWidget/component";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { TABLE_SIZES } from "../Constants";

const Wrapper = styled.div<{ compactMode: string }>`
  padding: 1px;
  border: 1px solid ${Colors.GREEN_1};
  box-shadow: 0px 0px 0px 2px ${Colors.GREEN_2};
  height: 100%;
  background: #fff;
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  left: 0;
  overflow: hidden;

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
    }
  }
`;

type renderInlineEditorPropsType = {
  compactMode: string;
  multiline: boolean;
  onChange: (text: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  value: any;
};

export function InlineCellEditor({
  compactMode,
  multiline,
  onChange,
  onDiscard,
  onSave,
  value,
}: renderInlineEditorPropsType) {
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
          }
          break;
      }
    },
    [onDiscard, onSave],
  );

  const onTextChange = useCallback((data: string) => {
    setCursorPos(inputRef.current?.selectionStart);
    onChange(data);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        if (cursorPos < value.length) {
          inputRef.current.selectionStart = cursorPos;
          inputRef.current.selectionEnd = cursorPos;
        } else {
          inputRef.current.selectionStart = cursorPos;
        }
      }
    }, 0);
  }, [cursorPos, inputRef.current]);

  return (
    <Wrapper compactMode={compactMode}>
      <BaseInputComponent
        autoFocus
        compactMode
        disableNewLineOnPressEnterKey={false}
        inputRef={inputRef}
        inputType={InputTypes.TEXT}
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
