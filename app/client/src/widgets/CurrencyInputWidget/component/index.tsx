import React from "react";
import CurrencyTypeDropdown, {
  CurrencyDropdownOptions,
} from "./CurrencyCodeDropdown";
import BaseInputComponent, {
  BaseInputComponentProps,
} from "widgets/BaseInputWidget/component";
import { RenderModes } from "constants/WidgetConstants";
import { InputTypes } from "widgets/BaseInputWidget/constants";

class CurrencyInputComponent extends React.Component<
  CurrencyInputComponentProps
> {
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
    if (this.props.currencyCode) {
      this.props.onCurrencyTypeChange(this.props.currencyCode);
    }
  }

  componentDidUpdate(prevProps: CurrencyInputComponentProps) {
    if (
      this.props.renderMode === RenderModes.CANVAS &&
      prevProps.currencyCode !== this.props.currencyCode
    ) {
      this.props.onCurrencyTypeChange(this.props.currencyCode);
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
        inputHTMLType="NUMBER"
        inputType={InputTypes.CURRENCY}
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
        leftIcon={
          <CurrencyTypeDropdown
            accentColor={this.props.accentColor}
            allowCurrencyChange={
              this.props.allowCurrencyChange && !this.props.disabled
            }
            borderRadius={this.props.borderRadius}
            onCurrencyTypeChange={this.props.onCurrencyTypeChange}
            options={CurrencyDropdownOptions}
            selected={this.props.currencyCode}
            widgetId={this.props.widgetId}
          />
        }
        multiline={false}
        onFocusChange={this.props.onFocusChange}
        onKeyDown={this.onKeyDown}
        onStep={this.props.onStep}
        onValueChange={this.props.onValueChange}
        placeholder={this.props.placeholder}
        showError={this.props.showError}
        stepSize={1}
        tooltip={this.props.tooltip}
        value={this.props.value}
        widgetId={this.props.widgetId}
      />
    );
  }
}

export interface CurrencyInputComponentProps extends BaseInputComponentProps {
  currencyCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimals?: number;
  onCurrencyTypeChange: (code?: string) => void;
  onStep: (direction: number) => void;
  renderMode: string;
}

export default CurrencyInputComponent;
