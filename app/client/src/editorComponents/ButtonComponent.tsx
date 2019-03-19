import * as React from "react"
import { Button, MaybeElement } from "@blueprintjs/core"
import { ITextComponentProps } from "./TextComponent"
import PositionContainer from "./PositionContainer"

class ButtomComponent extends React.Component<IButtonComponentProps> {
  render() {
    return (
      <PositionContainer {...this.props}>
        <Button text={this.props.text} icon={this.props.icon} />
      </PositionContainer>
    )
  }
}

interface IButtonComponentProps extends ITextComponentProps {
  icon?: MaybeElement
}

export default ButtomComponent
