import React from "react";
import InputTextControl, { InputText } from "./InputTextControl";

class CustomPlotlyChartControl extends InputTextControl {
  render() {
    const expected = "{\n  layout: {},\n  data: []\n}";
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
    return "CUSTOM_PLOTLY_CHARTS_DATA";
  }
}

export default CustomPlotlyChartControl;
