import React, { ChangeEventHandler } from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";

import styled from "constants/DefaultTheme";
import {
  Classes,
  INumericInputProps,
  ISliderProps,
  NumericInput,
  Slider,
} from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import { WidgetHeightLimits } from "constants/WidgetConstants";
import { ThemeProp } from "components/ads";

const StyledSlider = styled.input<{ progress: number }>`
  & {
    height: 30px;
    width: 100%;
    margin: 0;
    -webkit-appearance: none;
    background-color: transparent;
  }

  &::-moz-focus-outer {
    border: 0;
  }

  &:focus {
    outline: none;
  }

  &::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      #090707 calc(${(props) => props.progress}%),
      #dddddd calc(${(props) => props.progress}%)
    );
    border-radius: 3px;
    height: 3px;
    will-change: transform;
  }

  &::-moz-range-track {
    background: linear-gradient(
      to right,
      #090707 calc(${(props) => props.progress}%),
      #dddddd calc(${(props) => props.progress}%)
    );
    border-radius: 3px;
    height: 3px;
    will-change: transform;
  }

  &:disabled::-webkit-slider-runnable-track {
    background: var(--framer-fresco-sliderTrackDisabled-color, #eeeeee);
  }

  &:disabled::-moz-range-track {
    background: var(--framer-fresco-sliderTrackDisabled-color, #eeeeee);
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    background-color: var(--framer-fresco-sliderKnob-color, #ffffff);
    border: none;
    border-radius: 50%;
    box-shadow: var(
      --framer-fresco-sliderKnob-shadow,
      0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 0.5px 0px 0px rgba(0, 0, 0, 0.1)
    );
    cursor: pointer;
    height: 12px;
    margin-top: -5px;
    opacity: 1;
    width: 12px;
    will-change: transform;
  }

  &::-moz-range-thumb {
    -webkit-appearance: none;
    background-color: var(--framer-fresco-sliderKnob-color, #ffffff);
    border: none;
    border-radius: 50%;
    box-shadow: var(
      --framer-fresco-sliderKnob-shadow,
      0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 0.5px 0px 0px rgba(0, 0, 0, 0.1)
    );
    cursor: pointer;
    height: 12px;
    margin-top: -5px;
    opacity: 1;
    width: 12px;
    will-change: transform;
  }

  &:disabled::-webkit-slider-thumb {
    display: none;
  }

  &:disabled::-moz-range-thumb {
    display: none;
  }
`;

const StyledNumericInput = styled(NumericInput)<ThemeProp & INumericInputProps>`
  &&& {
    margin-left: 6px;
    &.bp3-control-group {
      .${Classes.INPUT} {
        &:focus {
          box-shadow: none;
          border-radius: 0;
          border: 1px solid var(--appsmith-input-focus-border-color);
        }
      }
      .bp3-input-group {
        border-radius: 0;
        width: 50px;
        align-self: stretch;
        input {
          height: 100%;
        }
        .bp3-input {
          font-size: 14px;
        }
      }
      .bp3-button-group {
        .bp3-button {
          border-radius: 0;
          &:focus {
            border: 1px solid var(--appsmith-input-focus-border-color);
          }
        }
      }
    }
  }
`;

interface SliderProps {
  onChange: (value: number) => void;
  onRelease: () => void;
  onStart: () => void;
  value: number;
}

function AdsSlider({ onChange, onRelease, onStart, value }: SliderProps) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <StyledSlider
      max={100}
      min={4}
      onChange={handleChange}
      onMouseDown={onStart}
      onMouseUp={onRelease}
      progress={value}
      type="range"
      value={value}
    />
  );
}

class SliderControl extends BaseControl<SliderControlProps> {
  render() {
    const max = (this.props.propertyValue || 0) + 100;
    return (
      <div style={{ display: "flex" }}>
        <AdsSlider
          onChange={this.onToggle}
          onRelease={this.onRelease}
          onStart={this.onStart}
          value={this.props.propertyValue}
        />
        <StyledNumericInput
          max={max}
          min={4}
          onValueChange={this.onToggle}
          value={this.props.propertyValue}
        />
      </div>
    );
  }

  onToggle = (value: number) => {
    this.updateProperty(this.props.propertyName, value);
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
