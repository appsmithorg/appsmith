import React from "react";
import InputTextControl, { InputText } from "./InputTextControl";

class CustomFusionChartControl extends InputTextControl {
  render() {
    const {
      propertyValue,
      isValid,
      label,
      placeholderText,
      dataTreePath,
      validationMessage,
      expected,
    } = this.props;
    return (
      <InputText
        label={label}
        value={propertyValue}
        onChange={this.onTextChange}
        isValid={isValid}
        errorMessage={validationMessage}
        expected={expected}
        placeholder={placeholderText}
        dataTreePath={dataTreePath}
      />
    );
  }
  static getControlType() {
    return "CUSTOM_FUSION_CHARTS_DATA";
  }
}

export default CustomFusionChartControl;
