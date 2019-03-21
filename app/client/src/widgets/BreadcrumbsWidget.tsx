import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType, CSSUnits } from "../constants/WidgetConstants"
import { Boundary, IBreadcrumbProps } from "@blueprintjs/core"
import BreadcrumbsComponent from "../editorComponents/BreadcrumbsComponent"
import _ from "lodash"

class BreadcrumbsWidget extends BaseWidget<
  IBreadcrumbsWidgetProps,
  IWidgetState
> {
  constructor(widgetProps: IBreadcrumbsWidgetProps) {
    super(widgetProps)
  }

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
    )
  }

  getWidgetType(): WidgetType {
    return "BREADCRUMBS_WIDGET"
  }
}

export interface IBreadcrumbsWidgetProps extends IWidgetProps {
  width?: number
  collapseFrom?: Boundary
  className?: string
  minVisibleItems?: number
  items?: IBreadcrumbProps[]
}

export default BreadcrumbsWidget
