import React, { ChangeEventHandler } from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";

import styled from "constants/DefaultTheme";
import {
  IRangeSliderProps,
  ISliderProps,
  NumberRange,
  RangeSlider,
  Slider,
} from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import { WidgetHeightLimits } from "constants/WidgetConstants";

const StyledSlider = styled(RangeSlider)`
  .bp3-slider-track,
  .bp3-slider-progress {
    border-radius: 3px;
    height: 3px;
  }

  .bp3-slider-progress {
    background: #dddddd;

    &.bp3-intent-primary {
      background: #090707;
    }
  }

  .bp3-slider-handle {
    background-color: #ffffff;
    box-shadow: var(
      0 1px 0 1px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(0, 0, 0, 0.2),
      0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 0.5px 0px 0px rgba(0, 0, 0, 0.1)
    );
    border-radius: 50%;
    cursor: pointer;
    height: 12px;
    width: 12px;
    border: none;
  }
`;

function AdsSlider(props: IRangeSliderProps) {
  return (
    <StyledSlider
      {...props}
      className={
        props.className
          ? props.className + " " + replayHighlightClass
          : replayHighlightClass
      }
      labelRenderer={false}
      max={100}
      min={4}
    />
  );
}

class SliderControl extends BaseControl<SliderControlProps> {
  render() {
    const value: [number, number] = [
      this.props.propertyValue,
      this.props.widgetProperties["maxDynamicHeight"],
    ];
    return (
      <AdsSlider
        className={this.props.propertyValue ? "checked" : "unchecked"}
        onChange={this.onToggle}
        onRelease={this.onRelease}
        value={value}
      />
    );
  }

  onToggle = (value: NumberRange) => {
    this.batchUpdateProperties({
      minDynamicHeight: value[0],
      maxDynamicHeight: value[1],
    });
    if (this.props.onChange) {
      this.props.onChange();
    }
  };

  onStart = () => {
    if (this.props.onStart) {
      this.props.onStart();
    }
  };

  onRelease = () => {
    if (this.props.onRelease) {
      this.props.onRelease();
    }
  };

  static getControlType() {
    return "SLIDER";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return value === "true" || value === "false";
  }
}

export interface SliderControlProps extends ControlProps {
  onChange?: () => void;
  onRelease?: () => void;
  onStart?: () => void;
}

export default SliderControl;
