import { Colors } from "constants/Colors";
import React, { useCallback } from "react";
import styled from "styled-components";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import InputComponent from "widgets/InputWidgetV2/component";

const Wrapper = styled.div`
  padding: 1px;
  border: 1px solid ${Colors.GREEN_1};
  box-shadow: 0px 0px 0px 2px ${Colors.GREEN_2};
  height: 100%;
  background: #fff;

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
  }
`;

type renderInlineEditorPropsType = {
  onChange: (text: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  value: any;
};

export function InlineCellEditor({
  onChange,
  onDiscard,
  onSave,
  value,
}: renderInlineEditorPropsType) {
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
          onSave();
      }
    },
    [onDiscard, onSave],
  );

  return (
    <Wrapper>
      <InputComponent
        autoFocus
        compactMode
        disableNewLineOnPressEnterKey={false}
        inputType={InputTypes.TEXT}
        isInvalid={false}
        isLoading={false}
        label=""
        multiline
        onFocusChange={onFocusChange}
        onKeyDown={onKeyDown}
        onValueChange={onChange}
        showError
        value={value}
        widgetId=""
      />
    </Wrapper>
  );
}
