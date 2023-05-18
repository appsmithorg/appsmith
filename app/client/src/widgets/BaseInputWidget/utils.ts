import type { WidgetProps } from "widgets/BaseWidget";
import type { InputType } from "widgets/InputWidget/constants";
import { InputTypes } from "./constants";

function isInputTypeSingleLineOrMultiLine(inputType: InputType) {
  return (
    inputType === InputTypes.MULTI_LINE_TEXT || inputType === InputTypes.TEXT
  );
}

export function checkInputTypeTextByProps(props: WidgetProps) {
  return isInputTypeSingleLineOrMultiLine(props.inputType);
}

export function checkInputTypeText(inputType: InputType) {
  return isInputTypeSingleLineOrMultiLine(inputType);
}
