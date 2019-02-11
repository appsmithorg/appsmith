import BaseComponent, { IComponentProps } from "./BaseComponent"
import { ContainerOrientation } from "../constants/WidgetConstants"
import styled from "../constants/DefaultTheme"
import React from "react"

const Container = styled("div")<IContainerProps>`
  background: ${props => props.theme.secondaryColor};
  color: ${props => props.theme.primaryColor};
  position: ${props => props.style.positionType};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit
  }};
`

class ContainerComponent extends BaseComponent<IContainerProps> {
  render() {
    return (
      <Container {...this.props}>
        {this.props.children
          ? this.props.children.map(child => {
              return child
            })
          : undefined}
      </Container>
    )
  }
}

export interface IContainerProps extends IComponentProps {
  children?: JSX.Element[]
  snapColumnSpace: number
  snapRowSpace: number
  snapColumns: number
  snapRows: number
  orientation: ContainerOrientation
}

export default ContainerComponent
