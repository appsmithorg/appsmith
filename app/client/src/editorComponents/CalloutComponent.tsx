import * as React from "react";
import { IComponentProps } from "./BaseComponent";
import { Callout, Code, H5, Intent, Switch } from "@blueprintjs/core";
import styled from "../constants/DefaultTheme";

const CalloutContainer = styled("span")<ICalloutComponentProps>`
  color: ${props => props.theme.primaryColor};
  position: ${props => props.style.positionType};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit;
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit;
  }};
`;

class CalloutComponent extends React.Component<ICalloutComponentProps> {
  render() {
    return (
      <CalloutContainer {...this.props}>
        <Callout
          {...this.props}
          title={this.props.title ? this.props.title : undefined}
        >
          {this.props.description}
        </Callout>
      </CalloutContainer>
    );
  }
}

export interface ICalloutComponentProps extends IComponentProps {
  id?: string;
  title?: string;
  description?: string;
  intent?: Intent;
  ellipsize?: boolean;
}

export default CalloutComponent;
