import * as React from "react";
import styled from "styled-components";
import {
  Alignment,
  Button,
  ButtonGroup,
  IButtonProps,
} from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ControlIcons } from "icons/ControlIcons";
import { ThemeProp } from "components/ads/common";
import { replayHighlightClass } from "globalStyles/portals";

const StyledButtonGroup = styled(ButtonGroup)`
  height: 33px;
`;

const StyledButton = styled(Button)<ThemeProp & IButtonProps>`
  border: ${(props) => (props.active ? `1px solid #6A86CE` : `none`)};
  border-radius: 0;
  background-color: #ffffff !important;

  & > div {
    display: flex;
  }

  &.bp3-active {
    box-shadow: none !important;
    background-color: #ffffff !important;
  }
  &:hover {
    background-color: #ffffff !important;
  }
`;

export interface LabelAlignmentOptionsControlProps extends ControlProps {
  propertyValue: Alignment | undefined;
  onChange: (align: Alignment) => void;
}

class LabelAlignmentOptionsControl extends BaseControl<
  LabelAlignmentOptionsControlProps
> {
  constructor(props: LabelAlignmentOptionsControlProps) {
    super(props);
  }

  static getControlType() {
    return "LABEL_ALIGNMENT_OPTIONS";
  }

  public render() {
    const { propertyValue } = this.props;

    return (
      <StyledButtonGroup className={replayHighlightClass} fill>
        <StyledButton
          active={
            propertyValue === Alignment.LEFT || propertyValue === undefined
          }
          icon={<ControlIcons.LEFT_ALIGN color="#979797" />}
          onClick={() => this.handleAlign(Alignment.LEFT)}
        />
        <StyledButton
          active={propertyValue === Alignment.RIGHT}
          icon={<ControlIcons.RIGHT_ALIGN color="#979797" />}
          onClick={() => this.handleAlign(Alignment.RIGHT)}
        />
      </StyledButtonGroup>
    );
  }

  private handleAlign = (align: Alignment) => {
    this.updateProperty(this.props.propertyName, align);
  };
}

export default LabelAlignmentOptionsControl;
