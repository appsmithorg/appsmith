import * as React from "react"
import { IComponentProps } from "./BaseComponent"
import { Text } from "@blueprintjs/core"
import { Container } from "./ContainerComponent"
class TextComponent extends React.Component<ITextComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <Text ellipsize={this.props.ellipsize} tagName={this.props.tagName}>
          {this.props.text}
        </Text>
      </Container>
    )
  }
}

export interface ITextComponentProps extends IComponentProps {
  text?: string
  ellipsize?: boolean
  tagName?: keyof JSX.IntrinsicElements
}

export default TextComponent
