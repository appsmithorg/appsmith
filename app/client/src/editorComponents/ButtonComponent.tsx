import * as React from "react"
import { Button, MaybeElement } from "@blueprintjs/core"
import { ITextComponentProps } from "./TextComponent";

class ButtomComponent extends React.Component<IButtonComponentProps> {
  render() {
    return <Button text={this.props.text} icon={this.props.icon} />
  }
}

interface IButtonComponentProps extends ITextComponentProps {
  icon?: MaybeElement
}

export default ButtomComponent
