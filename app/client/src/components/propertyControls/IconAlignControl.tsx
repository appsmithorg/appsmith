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

export interface IconAlignControlProps extends ControlProps {
  propertyValue: Alignment | undefined;
  onChange: (align: Alignment) => void;
}

class IconAlignControl extends BaseControl<IconAlignControlProps> {
  constructor(props: IconAlignControlProps) {
    super(props);
  }

  static getControlType() {
    return "ICON_ALIGN";
  }

  public render() {
    const { propertyValue } = this.props;

    return (
      <StyledButtonGroup className={replayHighlightClass} fill>
        <StyledButton
          active={propertyValue === Alignment.LEFT || undefined}
          icon={<ControlIcons.ICON_ALIGN_LEFT color="#979797" />}
          onClick={() => this.handleAlign(Alignment.LEFT)}
        />
        <StyledButton
          active={propertyValue === Alignment.RIGHT}
          icon={<ControlIcons.ICON_ALIGN_RIGHT color="#979797" />}
          onClick={() => this.handleAlign(Alignment.RIGHT)}
        />
      </StyledButtonGroup>
    );
  }

  private handleAlign = (align: Alignment) => {
    this.updateProperty(this.props.propertyName, align);
  };
}

export default IconAlignControl;
