import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import StepComponent from "components/ads/StepComponent";
class StepControl extends BaseControl<StepControlProps> {
  getStepTypeControls = () => {
    const { stepType } = this.props;
    if (stepType === "ZOOM_PERCENTAGE") {
      return {
        min: 0,
        max: 100,
        steps: 5,
        displayFormat: (value: number): string => {
          return `${value}%`;
        },
      };
    }
    return {
      min: 0,
      max: 100,
      steps: 1,
      displayFormat: (value: number): string => {
        return `${value}`;
      },
    };
  };

  render() {
    const { displayFormat, max, min, steps } = this.getStepTypeControls();
    return (
      <StepComponent
        displayFormat={displayFormat}
        max={max}
        min={min}
        onChange={(value: number) => {
          this.updateProperty(this.props.propertyName, value);
        }}
        steps={steps}
        value={this.props.propertyValue}
      />
    );
  }

  static getControlType() {
    return "STEP";
  }
}

export type StepType = "ZOOM_PERCENTAGE";

export interface StepControlProps extends ControlProps {
  stepType: StepType;
}

export default StepControl;
