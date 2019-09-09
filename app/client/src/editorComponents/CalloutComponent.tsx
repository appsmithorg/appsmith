import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import { Callout, Intent } from "@blueprintjs/core";
import { Container } from "./ContainerComponent";
class CalloutComponent extends React.Component<CalloutComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <Callout
          title={this.props.title ? this.props.title : undefined}
          intent={this.props.intent}
        >
          {this.props.description}
        </Callout>
      </Container>
    );
  }
}

export interface CalloutComponentProps extends ComponentProps {
  id?: string;
  title?: string;
  description?: string;
  intent?: Intent;
  ellipsize?: boolean;
}

export default CalloutComponent;
