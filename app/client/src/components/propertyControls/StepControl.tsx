import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { NumberInput } from "@appsmith/ads";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

const MIN = 0;
const MAX = 100;

class StepControl extends BaseControl<StepControlProps> {
  componentRef = React.createRef<HTMLInputElement>();

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
        suffix: "%",
      };
    }

    return {
      min: MIN,
      max: MAX,
      steps: 1,
    };
  };

  render() {
    const { max, min, steps, suffix } = this.getStepTypeControls();

    return (
      <NumberInput
        max={max}
        min={min}
        // TODO: UI builders -> confirm isUpdatedViaKeyboard is needed going forward
        onChange={(value: string | undefined, isUpdatedViaKeyboard = false) => {
          const v = value ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : 0;

          this.updateProperty(this.props.propertyName, v, isUpdatedViaKeyboard);
        }}
        ref={this.componentRef}
        scale={steps}
        suffix={suffix}
        value={this.props.propertyValue}
      />
    );
  }

  static getControlType() {
    return "STEP";
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
