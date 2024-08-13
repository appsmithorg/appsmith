import React from "react";
import { Alignment } from "@blueprintjs/core";
import type { SegmentedControlOption } from "@appsmith/ads";
import { SegmentedControl } from "@appsmith/ads";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

export interface LabelAlignmentOptionsControlProps extends ControlProps {
  propertyValue?: Alignment;
  options: SegmentedControlOption[];
  defaultValue: Alignment;
  fullWidth?: boolean;
}

class LabelAlignmentOptionsControl extends BaseControl<LabelAlignmentOptionsControlProps> {
  componentRef = React.createRef<HTMLDivElement>();

  constructor(props: LabelAlignmentOptionsControlProps) {
    super(props);
    this.handleAlign = this.handleAlign.bind(this);
  }

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
    return "LABEL_ALIGNMENT_OPTIONS";
  }

  public render() {
    const { options, propertyValue } = this.props;
    return (
      <SegmentedControl
        isFullWidth={this.props.fullWidth}
        onChange={this.handleAlign}
        options={options}
        ref={this.componentRef}
        value={propertyValue || Alignment.LEFT}
      />
    );
  }

  private handleAlign(align: string, isUpdatedViaKeyboard = false) {
    this.updateProperty(this.props.propertyName, align, isUpdatedViaKeyboard);
  }
}

export default LabelAlignmentOptionsControl;
