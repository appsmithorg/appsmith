import React from "react";
import styled from "styled-components";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { SegmentedControlOption } from "@appsmith/ads";
import { SegmentedControl } from "@appsmith/ads";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

const StyledSegmentedControl = styled(SegmentedControl)`
  > .ads-v2-segmented-control__segments-container {
    flex: 1 1 0%;
  }
`;

export interface IconTabControlProps extends ControlProps {
  options: SegmentedControlOption[];
  defaultValue: string;
  fullWidth: boolean;
}

class IconTabControl extends BaseControl<IconTabControlProps> {
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

  selectOption = (value: string, isUpdatedViaKeyboard = false) => {
    if (this.props.propertyValue !== value) {
      this.updateProperty(this.props.propertyName, value, isUpdatedViaKeyboard);
    }
  };

  render() {
    return (
      <StyledSegmentedControl
        isFullWidth={this.props.fullWidth}
        onChange={this.selectOption}
        options={this.props.options}
        ref={this.componentRef}
        value={this.props.propertyValue || this.props.defaultValue}
      />
    );
  }

  static getControlType() {
    return "ICON_TABS";
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    if (
      (config as IconTabControlProps)?.options
        ?.map((x: { value: string }) => x.value)
        .includes(value)
    )
      return true;

    return false;
  }
}

export default IconTabControl;
