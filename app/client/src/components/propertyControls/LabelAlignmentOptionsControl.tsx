import React from "react";
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
import { Colors } from "constants/Colors";

const StyledButtonGroup = styled(ButtonGroup)`
  height: 33px;
`;

const StyledButton = styled(Button)<ThemeProp & IButtonProps>`
  &&& {
    box-shadow: none;
    background-image: none;
    background: none;
    border-radius: 0;
    border: 1px solid
      ${(props) => (props.active ? Colors.GREY_10 : Colors.GREY_5)};

    &:hover,
    &:active,
    &.bp3-active {
      background: ${Colors.GREY_3};
    }

    & > div {
      display: flex;
      cursor: pointer;
    }
  }
`;

export interface LabelAlignmentOptionsControlProps extends ControlProps {
  propertyValue: Alignment | undefined;
  onChange: (align: Alignment) => void;
}

class LabelAlignmentOptionsControl extends BaseControl<
  LabelAlignmentOptionsControlProps
> {
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
          onClick={this.handleAlign(Alignment.LEFT)}
        />
        <StyledButton
          active={propertyValue === Alignment.RIGHT}
          icon={<ControlIcons.RIGHT_ALIGN color="#979797" />}
          onClick={this.handleAlign(Alignment.RIGHT)}
        />
      </StyledButtonGroup>
    );
  }

  private handleAlign(align: Alignment) {
    return () => {
      this.updateProperty(this.props.propertyName, align);
    };
  }
}

export default LabelAlignmentOptionsControl;
