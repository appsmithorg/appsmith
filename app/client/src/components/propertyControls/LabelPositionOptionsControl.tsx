import * as React from "react";
import styled from "styled-components";
import { Button, ButtonGroup, IButtonProps } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ThemeProp } from "components/ads/common";
import { LabelPosition } from "components/constants";
import { replayHighlightClass } from "globalStyles/portals";
import { Colors } from "constants/Colors";

const StyledButtonGroup = styled(ButtonGroup)`
  height: 33px;
`;

const StyledButton = styled(Button)<ThemeProp & IButtonProps>`
  &&& {
    border-radius: 0;
    box-shadow: none;
    background-image: none;
    background: none;
    border: 1px solid
      ${(props) => (props.active ? Colors.GREY_10 : Colors.GREY_5)};
    font-size: 14px;

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

export interface LabelPositionOptionsControlProps extends ControlProps {
  propertyValue: LabelPosition | undefined;
  onChange: (labelPosition: LabelPosition) => void;
  options: any[];
}

class LabelPositionOptionsControl extends BaseControl<
  LabelPositionOptionsControlProps
> {
  constructor(props: LabelPositionOptionsControlProps) {
    super(props);
  }

  static getControlType() {
    return "LABEL_POSITION_OPTIONS";
  }

  public render() {
    const { options, propertyValue } = this.props;

    return (
      <StyledButtonGroup className={replayHighlightClass} fill>
        {options.map((option: LabelPosition) => {
          const active =
            option === LabelPosition.Auto
              ? propertyValue === option || propertyValue === undefined
              : propertyValue === option;

          return (
            <StyledButton
              active={active}
              key={option}
              onClick={() => this.toggleOption(option)}
              text={option}
            />
          );
        })}
      </StyledButtonGroup>
    );
  }

  private toggleOption = (option: LabelPosition) => {
    this.updateProperty(this.props.propertyName, option);
  };
}

export default LabelPositionOptionsControl;
