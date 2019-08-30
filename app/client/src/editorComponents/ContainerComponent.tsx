import BaseComponent, { IComponentProps } from "./BaseComponent"
import { ContainerOrientation } from "../constants/WidgetConstants"
import styled from "../constants/DefaultTheme"
import React from "react"

export const Container = styled("div")<IContainerProps>`
  display: flex;
  flex-direction: ${props => {
    return props.orientation === "HORIZONTAL" ? "row" : "column"
  }};
  background: ${props => props.style.backgroundColor};
  color: ${props => props.theme.primaryColor};
  position: ${props => {
    return props.style.positionType === "ABSOLUTE" ? "absolute" : "relative"
  }};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit
  }};
`

class ContainerComponent extends BaseComponent<IContainerProps> {
  render() {
    return <Container {...this.props}>{this.props.children}</Container>
  }
}

export interface IContainerProps extends IComponentProps {
  children?: JSX.Element[] | JSX.Element
  orientation?: ContainerOrientation
}

export default ContainerComponent
