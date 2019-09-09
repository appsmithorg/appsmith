import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import { Boundary, Breadcrumbs, IBreadcrumbProps } from "@blueprintjs/core";
import { Container } from "./ContainerComponent";

class BreadcrumbsComponent extends React.Component<BreadcrumbsComponentProps> {
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
    );
  }
}

export interface BreadcrumbsComponentProps extends ComponentProps {
  width?: number;
  collapseFrom?: Boundary;
  className?: string;
  minVisibleItems?: number;
  items?: IBreadcrumbProps[];
}

export default BreadcrumbsComponent;
