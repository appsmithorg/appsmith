import React from "react";
import {
  combineDynamicBindings,
  getDynamicBindings,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import ColorPickerComponent from "components/ads/ColorPickerComponentV2";

class PrimaryColumnsColorPickerControlV2 extends BaseControl<
  PrimaryColumnColorPickerControlPropsV2
> {
  handleChangeColor = (color: string) => {
    let computedColor = color;

    if (isDynamicValue(color)) {
      const { jsSnippets, stringSegments } = getDynamicBindings(color);

      const js = combineDynamicBindings(jsSnippets, stringSegments);
      computedColor = `{{${this.props.widgetProperties.widgetName}.processedTableData.map((currentRow, currentIndex) => ( ${js}))}}`;
    }

    this.updateProperty(this.props.propertyName, computedColor);
  };

  render() {
    const computedEvaluatedValue = Array.isArray(this.props.evaluatedValue)
      ? this.props.evaluatedValue[0]
      : this.props.evaluatedValue;

    return (
      <ColorPickerComponent
        changeColor={this.handleChangeColor}
        color={
          this.props.propertyValue && isDynamicValue(this.props.propertyValue)
            ? computedEvaluatedValue
            : this.props.propertyValue || ""
        }
        showApplicationColors
        showThemeColors
      />
    );
  }

  static getControlType() {
    return "PRIMARY_COLUMNS_COLOR_PICKER_V2";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isDynamicValue(value);
  }
}

export interface PrimaryColumnColorPickerControlPropsV2 extends ControlProps {
  defaultColor?: string;
}

export default PrimaryColumnsColorPickerControlV2;
