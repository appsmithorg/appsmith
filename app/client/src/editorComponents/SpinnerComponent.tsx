import * as React from "react"
import { IComponentProps } from "./BaseComponent"
import { Spinner, Intent } from "@blueprintjs/core"
import { Container } from "./ContainerComponent"

class SpinnerComponent extends React.Component<ISpinnerComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <Spinner
          size={this.props.size}
          value={this.props.value}
          intent={this.props.intent}
        />
      </Container>
    )
  }
}

export interface ISpinnerComponentProps extends IComponentProps {
  size?: number
  value?: number
  intent?: Intent
}

export default SpinnerComponent
