import * as React from "react";
import { IComponentProps } from "./BaseComponent";
import PositionContainer from "./PositionContainer";
import { Callout, Code, H5, Intent, Switch } from "@blueprintjs/core";

class CalloutComponent extends React.Component<ICalloutComponentProps> {
  render() {
    return (
      <PositionContainer {...this.props}>
        <Callout
          {...this.props}
          title={this.props.title ? this.props.title : undefined}
          intent={this.props.intent}
        >
          {this.props.description}
        </Callout>
      </PositionContainer>
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
