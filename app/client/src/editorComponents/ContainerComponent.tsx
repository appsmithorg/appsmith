import * as React from "react"
import BaseComponent, { IComponentProps } from "./BaseComponent"
import { ContainerOrientation } from "../constants/WidgetConstants"
import styled from "../constants/DefaultTheme"

const Container = styled.div`
  background: ${props => props.theme.primaryColor};
  color: ${props => props.theme.primaryColor};
`

class ContainerComponent extends BaseComponent<IContainerProps> {
  render() {
    return (
      <Container key={this.componentData.widgetId}>
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
  snapColumnSpace?: number
  snapRowSpace?: number
  snapColumns?: number
  snapRows?: number
  orientation?: ContainerOrientation
}

export default ContainerComponent
