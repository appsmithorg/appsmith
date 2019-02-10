import * as React from "react"
import { Text } from "@blueprintjs/core"
import { IComponentProps } from "./BaseComponent";

class TextComponent extends React.Component<ITextComponentProps> {

  render() {
    return <Text ellipsize={this.props.ellipsize}>{this.props.text}</Text>
  }
}

export interface ITextComponentProps extends IComponentProps {
  text?: string
  ellipsize?: boolean
}

export default TextComponent
