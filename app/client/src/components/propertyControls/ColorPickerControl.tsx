import React from "react";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import ColorPickerComponent from "components/propertyControls/ColorPickerComponentV2";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";
import tinycolor from "tinycolor2";

class ColorPickerControl extends BaseControl<ColorPickerControlProps> {
  componentRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.componentRef.current?.addEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  componentWillUnmount() {
    this.componentRef.current?.removeEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  handleAdsEvent = (e: CustomEvent<DSEventDetail>) => {
    if (
      e.detail.component === "ColorPicker" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.componentRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

  handleChangeColor = (color: string, isUpdatedViaKeyboard: boolean) => {
    let _color = color;

    _color = tinycolor(color).isValid() ? tinycolor(color).toString() : color;

    this.updateProperty(this.props.propertyName, _color, isUpdatedViaKeyboard);
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
        ref={this.componentRef}
        showApplicationColors
        showThemeColors
      />
    );
  }

  static getControlType() {
    return "COLOR_PICKER";
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isDynamicValue(value);
  }
}

export interface ColorPickerControlProps extends ControlProps {
  defaultColor?: string;
}

export default ColorPickerControl;
