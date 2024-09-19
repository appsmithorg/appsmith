import { useDebouncedValue } from "@mantine/hooks";
import React from "react";
import type { BaseInputComponentProps } from "widgets/BaseInputWidget/component";
import BaseInputComponent from "widgets/BaseInputWidget/component";
import type { InputTypes } from "widgets/BaseInputWidget/constants";

const getInputHTMLType = (inputType: InputTypes) => {
  switch (inputType) {
    case "NUMBER":
      return "NUMBER";
    case "TEXT":
      return "TEXT";
    case "EMAIL":
      return "EMAIL";
    case "PASSWORD":
      return "PASSWORD";
    default:
      return "TEXT";
  }
};

const DEBOUNCE_TIME = 300;

const InputComponent = (props: InputComponentProps) => {
  // Note: because of how derived props are handled by MetaHoc, the isValid shows wrong
  // values for some milliseconds. To avoid that, we are using debounced value.
  const [isInvalid] = useDebouncedValue(props.isInvalid, DEBOUNCE_TIME);
  const [errorMessage] = useDebouncedValue(props.errorMessage, DEBOUNCE_TIME);

  return (
    <BaseInputComponent
      accentColor={props.accentColor}
      allowNumericCharactersOnly={props.allowNumericCharactersOnly}
      autoComplete={props.autoComplete}
      autoFocus={props.autoFocus}
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      buttonPosition={props.buttonPosition}
      compactMode={props.compactMode}
      defaultValue={props.defaultValue}
      disableNewLineOnPressEnterKey={props.disableNewLineOnPressEnterKey}
      disabled={props.disabled}
      errorMessage={props.isInvalid ? errorMessage : ""}
      fill={props.fill}
      iconAlign={props.iconAlign}
      iconName={props.iconName}
      inputHTMLType={getInputHTMLType(props.inputType)}
      inputRef={props.inputRef}
      inputType={props.inputType}
      intent={props.intent}
      isDynamicHeightEnabled={props.isDynamicHeightEnabled}
      isInvalid={isInvalid}
      isLoading={props.isLoading}
      label={props.label}
      labelAlignment={props.labelAlignment}
      labelPosition={props.labelPosition}
      labelStyle={props.labelStyle}
      labelTextColor={props.labelTextColor}
      labelTextSize={props.labelTextSize}
      labelWidth={props.labelWidth}
      maxChars={props.maxChars}
      maxNum={props.maxNum}
      minNum={props.minNum}
      multiline={props.multiline}
      onFocusChange={props.onFocusChange}
      onKeyDown={props.onKeyDown}
      onValueChange={props.onValueChange}
      placeholder={props.placeholder}
      rtl={props.rtl}
      showError={props.showError}
      spellCheck={props.spellCheck}
      stepSize={1}
      tooltip={props.tooltip}
      value={props.value}
      widgetId={props.widgetId}
    />
  );
};

export interface InputComponentProps extends BaseInputComponentProps {
  inputType: InputTypes;
  maxChars?: number;
  spellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
  borderRadius?: string;
  boxShadow?: string;
  accentColor?: string;
  autoComplete?: string;
  rtl?: boolean;
}

export default InputComponent;
