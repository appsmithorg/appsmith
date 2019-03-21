import * as React from "react"
import { IComponentProps } from "./BaseComponent"
import {
  Boundary,
  Breadcrumbs,
  Breadcrumb,
  Card,
  IBreadcrumbProps
} from "@blueprintjs/core"
import { Container } from "./ContainerComponent"

class BreadcrumbsComponent extends React.Component<IBreadcrumbsComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <Breadcrumbs
          collapseFrom={this.props.collapseFrom}
          items={this.props.items}
          minVisibleItems={this.props.minVisibleItems}
          className={this.props.className}
        />
      </Container>
    )
  }
}

export interface IBreadcrumbsComponentProps extends IComponentProps {
  width?: number
  collapseFrom?: Boundary
  className?: string
  minVisibleItems?: number
  items?: IBreadcrumbProps[]
}

export default BreadcrumbsComponent
