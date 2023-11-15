import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { NumberInput } from "design-system";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";
import { useDispatch } from "react-redux";
import { updateZoneCountAction } from "layoutSystems/anvil/integrations/actions/sectionActions";

const MIN = 1;
const MAX = 4;

const ZoneNumInput = ({
  max,
  min,
  ref,
  steps,
  widgetId,
  zoneCount,
}: {
  widgetId: string;
  max: number;
  min: number;
  ref: React.RefObject<HTMLInputElement>;
  steps: number;
  zoneCount: any;
}) => {
  const dispatch = useDispatch();
  return (
    <NumberInput
      max={max}
      min={min}
      onChange={(value: string | undefined) => {
        const v = value ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : 0;
        if (v === zoneCount) {
          return;
        }
        dispatch(updateZoneCountAction(widgetId, v));
      }}
      ref={ref}
      scale={steps}
      value={zoneCount}
    />
  );
};

class ZoneStepperControl extends BaseControl<ZoneStepperControlProps> {
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
    return {
      min: MIN,
      max: MAX,
      steps: 1,
    };
  };

  render() {
    const { max, min, steps } = this.getStepTypeControls();
    return (
      <ZoneNumInput
        max={max}
        min={min}
        ref={this.componentRef}
        steps={steps}
        widgetId={this.props.widgetProperties.widgetId}
        zoneCount={this.props.propertyValue}
      />
    );
  }

  static getControlType() {
    return "ZONE_STEPPER";
  }

  static canDisplayValueInUI(
    config: ZoneStepperControlProps,
    value: any,
  ): boolean {
    const steps = 1;
    return value >= MIN && value <= MAX && value % steps === 0;
  }
}

export interface ZoneStepperControlProps extends ControlProps {}

export default ZoneStepperControl;
