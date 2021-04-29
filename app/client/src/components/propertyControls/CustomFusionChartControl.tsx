import React from "react";
import InputTextControl, { InputText } from "./InputTextControl";

class CustomFusionChartControl extends InputTextControl {
  render() {
    const expected = "{\n  type: string,\n  dataSource: Object\n}";
    const {
      propertyValue,
      isValid,
      label,
      placeholderText,
      dataTreePath,
      validationMessage,
    } = this.props;
    return (
      <InputText
        dataTreePath={dataTreePath}
        errorMessage={validationMessage}
        expected={expected}
        isValid={isValid}
        label={label}
        onChange={this.onTextChange}
        placeholder={placeholderText}
        value={propertyValue}
      />
    );
  }
  static getControlType() {
    return "CUSTOM_FUSION_CHARTS_DATA";
  }
}

export default CustomFusionChartControl;
