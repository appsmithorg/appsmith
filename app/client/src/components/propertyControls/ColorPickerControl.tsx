import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import ColorPickerComponent from "components/ads/ColorPickerComponent";

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
}

export interface ColorPickerControlProps extends ControlProps {
  defaultColor?: string;
}

export default ColorPickerControl;
