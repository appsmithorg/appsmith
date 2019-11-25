import * as React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Spinner, Intent } from "@blueprintjs/core";

class SpinnerComponent extends React.Component<SpinnerComponentProps> {
  render() {
    return (
      <Spinner
        size={this.props.size}
        value={this.props.value}
        intent={this.props.intent}
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
