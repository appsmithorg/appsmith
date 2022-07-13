import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import StepComponent from "components/ads/StepComponent";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

const MIN = 0;
const MAX = 100;

class StepControl extends BaseControl<StepControlProps> {
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
      e.detail.component === "StepComponent" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.componentRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

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
        onChange={(value: number, isUpdatedViaKeyboard: boolean) => {
          this.updateProperty(
            this.props.propertyName,
            value,
            isUpdatedViaKeyboard,
          );
        }}
        ref={this.componentRef}
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
