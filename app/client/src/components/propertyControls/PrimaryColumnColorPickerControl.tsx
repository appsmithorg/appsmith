import React from "react";
import {
  combineDynamicBindings,
  getDynamicBindings,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import ColorPickerComponent from "components/propertyControls/ColorPickerComponentV2";

class PrimaryColumnsColorPickerControl extends BaseControl<PrimaryColumnColorPickerControlProps> {
  handleChangeColor = (color: string) => {
    let computedColor = color;

    if (isDynamicValue(color)) {
      const { jsSnippets, stringSegments } = getDynamicBindings(color);

      const js = combineDynamicBindings(jsSnippets, stringSegments);
      computedColor = `{{${this.props.widgetProperties.widgetName}.sanitizedTableData.map((currentRow) => ( ${js}))}}`;
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
    return "PRIMARY_COLUMNS_COLOR_PICKER";
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isDynamicValue(value);
  }
}

export interface PrimaryColumnColorPickerControlProps extends ControlProps {
  defaultColor?: string;
}

export default PrimaryColumnsColorPickerControl;
