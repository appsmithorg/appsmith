import * as React from "react";
import { IComponentProps } from "./BaseComponent";
import { Icon, Intent } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import styled from "../constants/DefaultTheme";

const IconContainer = styled("span")<IIconComponentProps>`
  color: ${props => props.theme.primaryColor};
  position: ${props => props.style.positionType};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit;
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit;
  }};
`;

class IconComponent extends React.Component<IIconComponentProps> {
  render() {
    return (
      <IconContainer {...this.props}>
        <Icon icon={this.props.icon} iconSize={this.props.iconSize} />
      </IconContainer>
    );
  }
}

export interface IIconComponentProps extends IComponentProps {
  iconSize?: number;
  icon?: IconName;
  intent?: Intent;
  ellipsize?: boolean;
}

export default IconComponent;
