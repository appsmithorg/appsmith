import React from "react";
import InputTextControl, { InputText } from "./InputTextControl";

class CustomFusionChartControl extends InputTextControl {
  render() {
    const expected = '{\n  "type": string,\n  "dataSource": Object\n}';
    const { dataTreePath, label, placeholderText, propertyValue } = this.props;
    return (
      <InputText
        dataTreePath={dataTreePath}
        expected={expected}
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
