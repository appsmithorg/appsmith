import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";

import styled from "constants/DefaultTheme";
import { ISliderProps, Slider } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import { WidgetHeightLimits } from "constants/WidgetConstants";

const StyledSlider = styled(Slider)`
  &&&&& input:checked ~ span {
    background: ${Colors.GREY_10};
  }

  & input:focus + .bp3-control-indicator {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.2) !important;
  }
`;

function AdsSlider(props: ISliderProps) {
  return (
    <StyledSlider
      {...props}
      className={
        props.className
          ? props.className + " " + replayHighlightClass
          : replayHighlightClass
      }
      labelStepSize={25}
      max={100}
      min={0}
    />
  );
}

class SliderControl extends BaseControl<ControlProps> {
  render() {
    return (
      <AdsSlider
        className={this.props.propertyValue ? "checked" : "unchecked"}
        onChange={this.onToggle}
        value={this.props.propertyValue}
      />
    );
  }

  onToggle = (value: number) => {
    this.updateProperty(this.props.propertyName, value);
  };

  static getControlType() {
    return "SLIDER";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return value === "true" || value === "false";
  }
}

export type SliderControlProps = ControlProps;

export default SliderControl;
