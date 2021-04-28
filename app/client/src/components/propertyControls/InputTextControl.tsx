import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDynamicInput } from "./StyledControls";
import { InputType } from "widgets/InputWidget";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";

export function InputText(props: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  isValid: boolean;
  errorMessage?: string;
  evaluatedValue?: any;
  expected?: string;
  placeholder?: string;
  dataTreePath?: string;
  additionalAutocomplete?: Record<string, Record<string, unknown>>;
  theme?: EditorTheme;
  hideEvaluatedValue?: boolean;
  jsErrorMessage?: string;
}) {
  const {
    errorMessage,
    expected,
    value,
    isValid,
    onChange,
    placeholder,
    dataTreePath,
    evaluatedValue,
    hideEvaluatedValue,
    jsErrorMessage,
  } = props;

  return (
    <StyledDynamicInput>
      <CodeEditor
        input={{
          value: value,
          onChange: onChange,
        }}
        evaluatedValue={evaluatedValue}
        expected={expected}
        dataTreePath={dataTreePath}
        meta={{
          error: isValid ? "" : errorMessage,
          touched: true,
          isJsError: jsErrorMessage && jsErrorMessage.length > 0 ? true : false,
          jsError: jsErrorMessage,
        }}
        theme={props.theme || EditorTheme.LIGHT}
        mode={EditorModes.TEXT_WITH_BINDING}
        tabBehaviour={TabBehaviour.INDENT}
        size={EditorSize.EXTENDED}
        placeholder={placeholder}
        additionalDynamicData={props.additionalAutocomplete}
        hideEvaluatedValue={hideEvaluatedValue}
      />
    </StyledDynamicInput>
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    const {
      expected,
      propertyValue,
      isValid,
      label,
      placeholderText,
      dataTreePath,
      validationMessage,
      defaultValue,
      additionalAutoComplete,
      hideEvaluatedValue,
      jsErrorMessage,
    } = this.props;

    return (
      <InputText
        label={label}
        value={propertyValue ? propertyValue : defaultValue}
        onChange={this.onTextChange}
        isValid={isValid}
        errorMessage={validationMessage}
        expected={expected}
        dataTreePath={dataTreePath}
        placeholder={placeholderText}
        theme={this.props.theme}
        additionalAutocomplete={additionalAutoComplete}
        hideEvaluatedValue={hideEvaluatedValue}
        jsErrorMessage={jsErrorMessage}
      />
    );
  }

  isNumberType(): boolean {
    const { inputType } = this.props;
    switch (inputType) {
      case "CURRENCY":
      case "INTEGER":
      case "NUMBER":
      case "PHONE_NUMBER":
        return true;
      default:
        return false;
    }
  }

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = event;
    if (typeof event !== "string") {
      value = event.target.value;
    }
    this.updateProperty(this.props.propertyName, value);
  };

  static getControlType() {
    return "INPUT_TEXT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
  inputType: InputType;
  validationMessage?: string;
  isDisabled?: boolean;
  defaultValue?: any;
}

export default InputTextControl;
