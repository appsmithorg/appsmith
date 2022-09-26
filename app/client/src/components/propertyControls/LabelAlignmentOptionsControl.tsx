import React from "react";
import styled from "styled-components";
import { Alignment } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ButtonTab, ButtonTabOption } from "design-system";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

const ControlContainer = styled.div`
  & > div:last-child {
    display: flex;
    & > div {
      flex: 1;
    }
  }
`;

export interface LabelAlignmentOptionsControlProps extends ControlProps {
  propertyValue?: Alignment;
  options: ButtonTabOption[];
  defaultValue: Alignment;
}

class LabelAlignmentOptionsControl extends BaseControl<
  LabelAlignmentOptionsControlProps
> {
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
      e.detail.component === "ButtonTab" &&
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
      <ControlContainer>
        <ButtonTab
          options={options}
          ref={this.componentRef}
          selectButton={this.handleAlign}
          values={[propertyValue || Alignment.LEFT]}
        />
      </ControlContainer>
    );
  }

  private handleAlign(align: string, isUpdatedViaKeyboard = false) {
    this.updateProperty(this.props.propertyName, align, isUpdatedViaKeyboard);
  }
}

export default LabelAlignmentOptionsControl;
