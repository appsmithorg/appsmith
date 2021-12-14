import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import ColorPickerComponent from "components/ads/ColorPickerComponentV2";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { get } from "lodash";

class ColorPickerControl extends BaseControl<ColorPickerControlProps> {
  handleChangeColor = (color: string) => {
    this.updateProperty(this.props.propertyName, color);
  };
  render() {
    let path;
    try {
      path =
        this.props.dataTreePath?.substr(
          this.props.dataTreePath.indexOf(".") + 1,
        ) || "";
    } catch (e) {
      path = "";
      log.error(e);
      Sentry.captureException(e);
    }
    return (
      <ColorPickerComponent
        changeColor={this.handleChangeColor}
        color={
          this.props.propertyValue
            ? this.props.propertyValue
            : this.props.defaultColor
        }
        evaluatedColorValue={get(
          this.props.widgetProperties.__evaluation__.evaluatedValues,
          path,
        )}
        showApplicationColors
        showThemeColors
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
