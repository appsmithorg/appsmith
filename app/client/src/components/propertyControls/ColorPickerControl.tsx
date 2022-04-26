import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import ColorPickerComponent from "components/ads/ColorPickerComponent";
import { isDynamicValue } from "utils/DynamicBindingUtils";

class ColorPickerControl extends BaseControl<ColorPickerControlProps> {
  handleChangeColor = (color: string) => {
    this.updateProperty(this.props.propertyName, color);
  };
  render() {
    return (
      <ColorPickerComponent
        changeColor={this.handleChangeColor}
        color={
          this.props.propertyValue
            ? this.props.propertyValue
            : this.props.defaultColor
        }
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
