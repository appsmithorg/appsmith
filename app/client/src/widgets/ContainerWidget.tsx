import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import ContainerComponent, {
  IContainerProps
} from "../editorComponents/ContainerComponent";
import {
  ContainerOrientation,
  WidgetType,
  CSSUnits
} from "../constants/WidgetConstants";
import WidgetFactory from "../utils/WidgetFactory";
import React from "react";
import _ from "lodash";

const DEFAULT_NUM_COLS = 13;
const DEFAULT_NUM_ROWS = 13;

class ContainerWidget extends BaseWidget<
  IContainerWidgetProps<IWidgetProps>,
  IWidgetState
> {
  snapColumnSpace: number = 100;
  snapRowSpace: number = 100;

  constructor(props: IContainerWidgetProps<IWidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
    this.state = {
      height: 0,
      width: 0
    };
  }

  componentWillReceiveProps(
    previousProps: IContainerWidgetProps<IWidgetProps>,
    nextProps: IContainerWidgetProps<IWidgetProps>
  ) {
    super.componentWillReceiveProps(previousProps, nextProps);
    this.snapColumnSpace =
      this.state.width / (nextProps.snapColumns || DEFAULT_NUM_COLS);
    this.snapRowSpace =
      this.state.height / (nextProps.snapRows || DEFAULT_NUM_ROWS);
  }

  renderChildWidget(childWidgetData: IWidgetProps) {
    childWidgetData.parentColumnSpace = this.snapColumnSpace;
    childWidgetData.parentRowSpace = this.snapRowSpace;
    return WidgetFactory.createWidget(childWidgetData);
  }

  getPageView() {
    return (
      <ContainerComponent
        widgetId={this.props.widgetId}
        style={{
          height: this.state.height,
          width: this.state.width,
          positionType: "ABSOLUTE",
          yPosition: this.props.topRow * this.props.parentRowSpace,
          xPosition: this.props.leftColumn * this.props.parentColumnSpace,
          xPositionUnit: CSSUnits.PIXEL,
          yPositionUnit: CSSUnits.PIXEL
        }}
        snapColumnSpace={this.snapColumnSpace}
        snapRowSpace={this.snapRowSpace}
        snapColumns={this.props.snapColumns || DEFAULT_NUM_COLS}
        snapRows={this.props.snapRows || DEFAULT_NUM_ROWS}
        orientation={this.props.orientation || "VERTICAL"}
      >
        {_.map(this.props.children, this.renderChildWidget)}
      </ContainerComponent>
    );
  }

  getWidgetType(): WidgetType {
    return "CONTAINER_WIDGET";
  }
}

export interface IContainerWidgetProps<T extends IWidgetProps>
  extends IWidgetProps {
  children?: T[];
  snapColumns?: number;
  snapRows?: number;
  orientation?: ContainerOrientation;
}

export default ContainerWidget;
