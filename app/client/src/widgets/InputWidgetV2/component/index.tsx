import React from "react";
import BaseInputComponent, {
  BaseInputComponentProps,
} from "widgets/BaseInputWidget/component";
import { InputTypes } from "widgets/BaseInputWidget/constants";

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

class InputComponent extends React.Component<InputComponentProps> {
  onTextChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    this.props.onValueChange(event.target.value);
  };

  getIcon(inputType: InputTypes) {
    switch (inputType) {
      case "EMAIL":
        return "envelope";
      default:
        return undefined;
    }
  }

  render() {
    return (
      <BaseInputComponent
        allowNumericCharactersOnly={this.props.allowNumericCharactersOnly}
        autoFocus={this.props.autoFocus}
        compactMode={this.props.compactMode}
        defaultValue={this.props.defaultValue}
        disableNewLineOnPressEnterKey={this.props.disableNewLineOnPressEnterKey}
        disabled={this.props.disabled}
        errorMessage={this.props.errorMessage}
        fill={this.props.fill}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputHTMLType={getInputHTMLType(this.props.inputType)}
        inputType={this.props.inputType}
        intent={this.props.intent}
        isInvalid={this.props.isInvalid}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        maxChars={this.props.maxChars}
        maxNum={this.props.maxNum}
        minNum={this.props.minNum}
        multiline={this.props.multiline}
        onFocusChange={this.props.onFocusChange}
        onKeyDown={this.props.onKeyDown}
        onValueChange={this.props.onValueChange}
        placeholder={this.props.placeholder}
        showError={this.props.showError}
        spellCheck={this.props.spellCheck}
        stepSize={1}
        tooltip={this.props.tooltip}
        value={this.props.value}
        widgetId={this.props.widgetId}
      />
    );
  }
}
export interface InputComponentProps extends BaseInputComponentProps {
  inputType: InputTypes;
  maxChars?: number;
  spellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
}

export default InputComponent;
