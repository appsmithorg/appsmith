import { noop } from "lodash";
import React from "react";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import InputComponent from "widgets/InputWidgetV2/component";
import { renderDefaultPropsType } from "./DefaultRenderer";

type renderInlineEditorPropsType = Pick<
  renderDefaultPropsType,
  "value" | "onCellChange" | "onCellUpdate"
>;

export function renderInlineEditor({
  onCellChange,
  value,
}: renderInlineEditorPropsType) {
  return (
    <InputComponent
      autoFocus
      compactMode
      disableNewLineOnPressEnterKey={false}
      inputType={InputTypes.TEXT}
      isInvalid={false}
      isLoading={false}
      label=""
      multiline
      onFocusChange={noop}
      onValueChange={() => onCellChange}
      showError
      value={value}
      widgetId=""
    />
  );
}
