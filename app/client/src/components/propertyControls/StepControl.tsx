import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import StepComponent from "components/ads/StepComponent";

const MIN = 0;
const MAX = 100;

class StepControl extends BaseControl<StepControlProps> {
  getStepTypeControls = () => {
    const { stepType } = this.props;
    if (stepType === "ZOOM_PERCENTAGE") {
      return {
        min: MIN,
        max: MAX,
        steps: 5,
        displayFormat: (value: number): string => {
          return `${value}%`;
        },
      };
    }
    return {
      min: MIN,
      max: MAX,
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

  static canDisplayValueInUI(config: StepControlProps, value: any): boolean {
    let steps = 1;
    if (config.stepType === "ZOOM_PERCENTAGE") {
      steps = 5;
    }
    return value >= MIN && value <= MAX && value % steps === 0;
  }
}

export type StepType = "ZOOM_PERCENTAGE";

export interface StepControlProps extends ControlProps {
  stepType: StepType;
}

export default StepControl;
