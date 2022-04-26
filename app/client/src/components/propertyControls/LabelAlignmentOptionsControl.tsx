import React from "react";
import styled from "styled-components";
import { Alignment } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import ButtonTabComponent, {
  ButtonTabOption,
} from "components/ads/ButtonTabComponent";

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
  constructor(props: LabelAlignmentOptionsControlProps) {
    super(props);
    this.handleAlign = this.handleAlign.bind(this);
  }
  static getControlType() {
    return "LABEL_ALIGNMENT_OPTIONS";
  }

  public render() {
    const { options, propertyValue } = this.props;
    return (
      <ControlContainer>
        <ButtonTabComponent
          options={options}
          selectButton={this.handleAlign}
          values={[propertyValue || Alignment.LEFT]}
        />
      </ControlContainer>
    );
  }

  private handleAlign(align: string) {
    this.updateProperty(this.props.propertyName, align);
  }
}

export default LabelAlignmentOptionsControl;
