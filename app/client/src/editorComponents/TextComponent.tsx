import * as React from "react"
import { IComponentProps } from "./BaseComponent"
import PositionContainer from "./PositionContainer";

class TextComponent extends React.Component<ITextComponentProps> {
  render() {
    return <PositionContainer {...this.props}>{this.props.text}</PositionContainer>
  }
}

export interface ITextComponentProps extends IComponentProps {
  text?: string
  ellipsize?: boolean
}

export default TextComponent
