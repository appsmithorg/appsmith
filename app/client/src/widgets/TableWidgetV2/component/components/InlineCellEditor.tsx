import React, { useCallback } from "react";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import InputComponent from "widgets/InputWidgetV2/component";

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
