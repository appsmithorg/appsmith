import type { WidgetProps } from "widgets/BaseWidget";

import { INPUT_TYPES } from "./constants";
import type { InputType } from "./constants";

function isInputTypeSingleLineOrMultiLine(inputType: InputType) {
  return (
    inputType === INPUT_TYPES.MULTI_LINE_TEXT || inputType === INPUT_TYPES.TEXT
  );
}

export function checkInputTypeTextByProps(props: WidgetProps) {
  return isInputTypeSingleLineOrMultiLine(props.inputType);
}

export function checkInputTypeText(inputType: InputType) {
  return isInputTypeSingleLineOrMultiLine(inputType);
}
