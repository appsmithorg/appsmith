import React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import ColorPickerComponent from "components/ads/ColorPickerComponentV2";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { INTERACTION_ANALYTICS_EVENT } from "utils/AppsmithUtils";

class ColorPickerControl extends BaseControl<ColorPickerControlProps> {
  isUpdatedViaKeyboard = false;
  containerRef = React.createRef<HTMLDivElement>();

  handleChangeColor = (color: string) => {
    this.updateProperty(
      this.props.propertyName,
      color,
      this.isUpdatedViaKeyboard,
    );
    this.isUpdatedViaKeyboard = false;
  };

  componentDidMount() {
    this.containerRef.current?.addEventListener(
      INTERACTION_ANALYTICS_EVENT,
      this.handleKbdEvent,
    );
  }

  componentWillUnmount() {
    this.containerRef.current?.removeEventListener(
      INTERACTION_ANALYTICS_EVENT,
      this.handleKbdEvent,
    );
  }

  handleKbdEvent = () => {
    this.isUpdatedViaKeyboard = true;
  };

  render() {
    const computedEvaluatedValue = Array.isArray(this.props.evaluatedValue)
      ? this.props.evaluatedValue[0]
      : this.props.evaluatedValue;

    return (
      <div ref={this.containerRef}>
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
      </div>
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
