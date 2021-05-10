import * as React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Spinner, Intent } from "@blueprintjs/core";

class SpinnerComponent extends React.Component<SpinnerComponentProps> {
  render() {
    return (
      <Spinner
        intent={this.props.intent}
        size={this.props.size}
        value={this.props.value}
      />
    );
  }
}

export interface SpinnerComponentProps extends ComponentProps {
  size?: number;
  value?: number;
  intent?: Intent;
}

export default SpinnerComponent;
