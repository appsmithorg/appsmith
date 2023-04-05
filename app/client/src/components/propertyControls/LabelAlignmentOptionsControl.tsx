import React from "react";
import styled from "styled-components";
import { Alignment } from "@blueprintjs/core";
import { SegmentedControl } from "design-system";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ButtonGroupOption } from "design-system-old";
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

export interface LabelAlignmentOptionsControlProps extends ControlProps {
  propertyValue?: Alignment;
  options: ButtonGroupOption[];
  defaultValue: Alignment;
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
      <StyledSegmentedControl
        defaultValue={propertyValue || Alignment.LEFT}
        // @ts-expect-error: type mismatch
        onChange={this.handleAlign}
        options={options}
        ref={this.componentRef}
      />
    );
  }

  private handleAlign(align: string, isUpdatedViaKeyboard = false) {
    this.updateProperty(this.props.propertyName, align, isUpdatedViaKeyboard);
  }
}

export default LabelAlignmentOptionsControl;
