import * as React from "react";
import styled from "styled-components";
import { Button, ButtonGroup, IButtonProps } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ThemeProp } from "components/ads/common";
import { LabelPosition, LabelPositionTypes } from "components/constants";
import { replayHighlightClass } from "globalStyles/portals";

const StyledButtonGroup = styled(ButtonGroup)`
  height: 33px;
`;

const StyledButton = styled(Button)<ThemeProp & IButtonProps>`
  border: ${(props) =>
    props.active ? `1px solid #6A86CE` : `1px solid #A9A7A7`};
  border-radius: 0;
  box-shadow: none !important;
  background-image: none !important;
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
            option === LabelPositionTypes.Auto
              ? propertyValue === option || propertyValue === undefined
              : propertyValue === option;

          return (
            <StyledButton
              active={active}
              key={option}
              large
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
