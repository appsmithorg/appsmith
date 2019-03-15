import * as React from "react";
import { IComponentProps } from "./BaseComponent";
import { Spinner, Intent } from "@blueprintjs/core";
import styled from "../constants/DefaultTheme";

const SpinnerContainer = styled("span")<ISpinnerComponentProps>`
  color: ${props => props.theme.primaryColor};
  position: ${props => props.style.positionType};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit;
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit;
  }};
`;

class SpinnerComponent extends React.Component<ISpinnerComponentProps> {
  render() {
    return (
      <SpinnerContainer {...this.props}>
        <Spinner
          size={this.props.size}
          value={this.props.value}
          intent={this.props.intent}
        />
      </SpinnerContainer>
    );
  }
}

export interface ISpinnerComponentProps extends IComponentProps {
  size?: number;
  value?: number;
  intent?: Intent;
  ellipsize?: boolean;
}

export default SpinnerComponent;
