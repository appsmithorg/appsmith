import * as React from "react";

import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Icon, SegmentedControl } from "@appsmith/ads";
import { boxShadowOptions, sizeMappings } from "constants/ThemeConstants";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";
export interface BoxShadowOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}
const options = Object.keys(boxShadowOptions).map((optionKey) => ({
  label:
    optionKey === "none" ? (
      <Icon name="close-line" size="md" />
    ) : (
      sizeMappings[optionKey]
    ),
  value: boxShadowOptions[optionKey],
}));

const optionsValues = new Set(Object.values(boxShadowOptions));

class BoxShadowOptionsControl extends BaseControl<BoxShadowOptionsControlProps> {
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
      e.detail.component === "ButtonGroup" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.componentRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

  static getControlType() {
    return "BOX_SHADOW_OPTIONS";
  }

  public render() {
    return (
      <SegmentedControl
        isFullWidth={false}
        onChange={(value, isUpdatedViaKeyboard = false) => {
          this.updateProperty(
            this.props.propertyName,
            value,
            isUpdatedViaKeyboard,
          );
        }}
        options={options}
        ref={this.componentRef}
        value={this.props.evaluatedValue || ""}
      />
    );
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return optionsValues.has(value);
  }
}

export default BoxShadowOptionsControl;
