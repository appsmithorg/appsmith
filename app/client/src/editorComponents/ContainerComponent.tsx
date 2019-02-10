import * as React from "react"
import BaseComponent, { IComponentProps } from "./BaseComponent"
import { ContainerOrientation } from "../constants/WidgetConstants"
import styled from "styled-components"

const Container = styled.div`
  background: papayawhip;
  color: ${props => (props.theme ? props.theme.colors.text : "white")};
`

class ContainerComponent extends BaseComponent<IContainerProps> {
  render() {
    return (
      <Container>
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
  children?: React.Component[]
  snapColumnSpace: number
  snapRowSpace: number
  snapColumns: number
  snapRows: number
  orientation: ContainerOrientation
}

export default ContainerComponent
