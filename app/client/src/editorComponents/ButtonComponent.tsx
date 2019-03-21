import * as React from "react"
import { Button, MaybeElement } from "@blueprintjs/core"
import { ITextComponentProps } from "./TextComponent"
import { Container } from "./ContainerComponent"

class ButtonComponent extends React.Component<IButtonComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <Button text={this.props.text} icon={this.props.icon} />
      </Container>
    )
  }
}

interface IButtonComponentProps extends ITextComponentProps {
  icon?: MaybeElement
}

export default ButtonComponent
