import * as React from "react";
import { IComponentProps } from "./BaseComponent";
import PositionContainer from "./PositionContainer";
import { Spinner, Intent } from "@blueprintjs/core";

class SpinnerComponent extends React.Component<ISpinnerComponentProps> {
  render() {
    return (
      <PositionContainer {...this.props}>
        <Spinner
          size={this.props.size}
          value={this.props.value}
          intent={this.props.intent}
        />
      </PositionContainer>
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
