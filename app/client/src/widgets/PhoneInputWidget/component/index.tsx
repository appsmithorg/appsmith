import React from "react";
import ISDCodeDropdown, {
  ISDCodeDropdownOptions,
  getSelectedISDCode,
} from "./ISDCodeDropdown";
import BaseInputComponent, {
  BaseInputComponentProps,
} from "widgets/BaseInputWidget/component";
import { CountryCode } from "libphonenumber-js";
import { InputTypes } from "widgets/BaseInputWidget/constants";

class PhoneInputComponent extends React.PureComponent<
  PhoneInputComponentProps
> {
  onTextChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    this.props.onValueChange(event.target.value);
  };

  getLeftIcon = () => {
    const selectedISDCode = getSelectedISDCode(this.props.dialCode);
    return (
      <ISDCodeDropdown
        accentColor={this.props.accentColor}
        allowDialCodeChange={this.props.allowDialCodeChange}
        borderRadius={this.props.borderRadius}
        disabled={!!this.props.disabled}
        onISDCodeChange={this.props.onISDCodeChange}
        options={ISDCodeDropdownOptions}
        selected={selectedISDCode}
        widgetId={this.props.widgetId}
      />
    );
  };

  onKeyDown = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (typeof this.props.onKeyDown === "function") {
      this.props.onKeyDown(e);
    }
  };

  componentDidMount() {
    if (this.props.dialCode) {
      this.props.onISDCodeChange(this.props.dialCode);
    }
  }

  render() {
    return (
      <BaseInputComponent
        accentColor={this.props.accentColor}
        autoFocus={this.props.autoFocus}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={this.props.compactMode}
        defaultValue={this.props.defaultValue}
        disableNewLineOnPressEnterKey={this.props.disableNewLineOnPressEnterKey}
        disabled={this.props.disabled}
        errorMessage={this.props.errorMessage}
        fill={this.props.fill}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputHTMLType="TEL"
        inputType={InputTypes.PHONE_NUMBER}
        intent={this.props.intent}
        isInvalid={this.props.isInvalid}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.props.labelWidth}
        leftIcon={this.getLeftIcon()}
        multiline={false}
        onFocusChange={this.props.onFocusChange}
        onKeyDown={this.onKeyDown}
        onValueChange={this.props.onValueChange}
        placeholder={this.props.placeholder}
        showError={this.props.showError}
        tooltip={this.props.tooltip}
        value={this.props.value}
        widgetId={this.props.widgetId}
      />
    );
  }
}

export interface PhoneInputComponentProps extends BaseInputComponentProps {
  dialCode?: string;
  countryCode?: CountryCode;
  onISDCodeChange: (code?: string) => void;
  allowDialCodeChange: boolean;
}

export default PhoneInputComponent;
