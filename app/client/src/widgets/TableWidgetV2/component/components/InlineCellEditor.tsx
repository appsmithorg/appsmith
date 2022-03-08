import { noop } from "lodash";
import React, { useCallback } from "react";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import InputComponent from "widgets/InputWidgetV2/component";
import { renderDefaultPropsType } from "../renderHelpers/DefaultRenderer";

type renderInlineEditorPropsType = {
  onChange: (text: string) => void;
  onBlur: () => void;
  value: any;
};

export function InlineCellEditor({
  onBlur,
  onChange,
  value,
}: renderInlineEditorPropsType) {
  const onFocusChange = useCallback((focus: boolean) => !focus && onBlur(), [
    onBlur,
  ]);

  return (
    <InputComponent
      autoFocus
      compactMode
      disableNewLineOnPressEnterKey={false}
      inputType={InputTypes.TEXT}
      isInvalid={false}
      isLoading={false}
      label=""
      onFocusChange={onFocusChange}
      onValueChange={onChange}
      showError
      value={value}
      widgetId=""
    />
  );
}
