import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import ColorPickerComponent from "components/ads/ColorPickerComponentV2";
import { isDynamicValue } from "utils/DynamicBindingUtils";

class ColorPickerControl extends BaseControl<ColorPickerControlProps> {
  handleChangeColor = (color: string, isUpdatedViaKeyboard: boolean) => {
    this.updateProperty(this.props.propertyName, color, isUpdatedViaKeyboard);
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
    return "COLOR_PICKER";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isDynamicValue(value);
  }
}

export interface ColorPickerControlProps extends ControlProps {
  defaultColor?: string;
}

export default ColorPickerControl;
