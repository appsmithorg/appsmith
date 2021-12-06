import React from "react";
import { InputTypes } from "../constants";

import CurrencyTypeDropdown, {
  CurrencyDropdownOptions,
  getSelectedCurrency,
} from "./CurrencyCodeDropdown";
import BaseInputComponent, {
  BaseInputComponentProps,
} from "../../BaseInputWidget/component";

class CurrencyInputComponent extends React.Component<
  CurrencyInputComponentProps
> {
  constructor(props: CurrencyInputComponentProps) {
    super(props);
  }

  getLeftIcon = () => {
    const selectedCurrencyCountryCode = getSelectedCurrency(
      this.props.countryCode,
    );
    return (
      <CurrencyTypeDropdown
        allowCurrencyChange={
          this.props.allowCurrencyChange && !this.props.disabled
        }
        onCurrencyTypeChange={this.props.onCurrencyTypeChange}
        options={CurrencyDropdownOptions}
        selected={selectedCurrencyCountryCode}
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

  getStepSize() {
    switch (this.props.decimals) {
      case 0:
        return 1;
      case 1:
        return 0.1;
      case 2:
        return 0.01;
    }
  }

  componentDidMount() {
    if (this.props.countryCode) {
      this.props.onCurrencyTypeChange(this.props.countryCode);
    }
  }

  render() {
    return (
      <BaseInputComponent
        autoFocus={this.props.autoFocus}
        compactMode={this.props.compactMode}
        defaultValue={this.props.defaultValue}
        disableNewLineOnPressEnterKey={this.props.disableNewLineOnPressEnterKey}
        disabled={this.props.disabled}
        errorMessage={this.props.errorMessage}
        fill={this.props.fill}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputHTMLType="NUMBER"
        inputType={InputTypes.PHONE_NUMBER}
        intent={this.props.intent}
        isInvalid={this.props.isInvalid}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        leftIcon={this.getLeftIcon()}
        multiline={false}
        onFocusChange={this.props.onFocusChange}
        onKeyDown={this.onKeyDown}
        onValueChange={this.props.onValueChange}
        placeholder={this.props.placeholder}
        showError={this.props.showError}
        stepSize={this.getStepSize()}
        tooltip={this.props.tooltip}
        value={this.props.value}
        widgetId={this.props.widgetId}
      />
    );
  }
}

export interface CurrencyInputComponentProps extends BaseInputComponentProps {
  countryCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimals?: number;
  onCurrencyTypeChange: (code?: string) => void;
}

export default CurrencyInputComponent;
