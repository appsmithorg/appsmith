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
