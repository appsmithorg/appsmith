import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { Boundary, IBreadcrumbProps } from "@blueprintjs/core";
import BreadcrumbsComponent from "../editorComponents/BreadcrumbsComponent";

class BreadcrumbsWidget extends BaseWidget<
  BreadcrumbsWidgetProps,
  WidgetState
> {
  getPageView() {
    return (
      <BreadcrumbsComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        collapseFrom={this.props.collapseFrom}
        items={this.props.items}
        minVisibleItems={this.props.minVisibleItems}
        className={this.props.className}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "BREADCRUMBS_WIDGET";
  }
}

export interface BreadcrumbsWidgetProps extends WidgetProps {
  width?: number;
  collapseFrom?: Boundary;
  className?: string;
  minVisibleItems?: number;
  items?: IBreadcrumbProps[];
}

export default BreadcrumbsWidget;
