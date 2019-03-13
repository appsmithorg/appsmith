import * as React from "react";
import { IComponentProps } from "./BaseComponent";
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
        <div className="bp3-callout">
          <h4 className="bp3-heading">{this.props.heading}</h4>
          {this.props.description}
        </div>
      </CalloutContainer>
    );
  }
}

export interface ICalloutComponentProps extends IComponentProps {
  id?: string;
  heading?: string;
  description?: string;
  ellipsize?: boolean;
}

export default CalloutComponent;
