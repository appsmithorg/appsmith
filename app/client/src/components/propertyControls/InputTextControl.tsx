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
        additionalDynamicData={props.additionalAutocomplete}
        dataTreePath={dataTreePath}
        evaluatedValue={evaluatedValue}
        expected={expected}
        hideEvaluatedValue={hideEvaluatedValue}
        input={{
          value: value,
          onChange: onChange,
        }}
        jsErrorMessage={jsErrorMessage}
        meta={{
          error: isValid ? "" : errorMessage,
          touched: true,
        }}
        mode={EditorModes.TEXT_WITH_BINDING}
        placeholder={placeholder}
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={props.theme || EditorTheme.LIGHT}
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
        additionalAutocomplete={additionalAutoComplete}
        dataTreePath={dataTreePath}
        errorMessage={validationMessage}
        expected={expected}
        hideEvaluatedValue={hideEvaluatedValue}
        isValid={isValid}
        jsErrorMessage={jsErrorMessage}
        label={label}
        onChange={this.onTextChange}
        placeholder={placeholderText}
        theme={this.props.theme}
        value={propertyValue ? propertyValue : defaultValue}
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
