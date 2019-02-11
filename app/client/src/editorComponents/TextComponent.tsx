import * as React from "react"
import { IComponentProps } from "./BaseComponent"
import styled from "../constants/DefaultTheme"

const TextContainer = styled("span")<ITextComponentProps>`
  color: ${props => props.theme.primaryColor};
  position: ${props => props.style.positionType};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit
  }};
`

class TextComponent extends React.Component<ITextComponentProps> {
  render() {
    return <TextContainer {...this.props}>{this.props.text}</TextContainer>
  }
}

export interface ITextComponentProps extends IComponentProps {
  text?: string
  ellipsize?: boolean
}

export default TextComponent
