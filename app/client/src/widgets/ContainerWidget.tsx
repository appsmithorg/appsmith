import React from "react";
import BaseWidget, {
  WidgetProps,
  WidgetState,
  WidgetFunctions,
} from "./BaseWidget";
import ContainerComponent from "../editorComponents/ContainerComponent";
import { ContainerOrientation, WidgetType } from "../constants/WidgetConstants";
import WidgetFactory from "../utils/WidgetFactory";
import _ from "lodash";
import { Color } from "../constants/Colors";
import DropTargetComponent from "../editorComponents/DropTargetComponent";
import { GridDefaults } from "../constants/WidgetConstants";

const { DEFAULT_GRID_COLUMNS, DEFAULT_GRID_ROWS } = GridDefaults;

class ContainerWidget extends BaseWidget<
  ContainerWidgetProps<WidgetProps>,
  ContainerWidgetState
> {
  constructor(props: ContainerWidgetProps<WidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
    this.state = {
      width: 0,
      height: 0,
      snapColumnSpace: DEFAULT_GRID_COLUMNS,
      snapRowSpace: DEFAULT_GRID_ROWS,
    };
  }

  componentDidUpdate(previousProps: ContainerWidgetProps<WidgetProps>) {
    super.componentDidUpdate(previousProps);
    let snapColumnSpace = this.state.snapColumnSpace;
    let snapRowSpace = this.state.snapRowSpace;
    if (this.state.width)
      snapColumnSpace =
        this.state.width / (this.props.snapColumns || DEFAULT_GRID_COLUMNS);
    if (this.state.height)
      snapRowSpace =
        this.state.height / (this.props.snapRows || DEFAULT_GRID_ROWS);
    if (
      this.state.snapColumnSpace !== snapColumnSpace ||
      this.state.snapRowSpace !== snapRowSpace
    ) {
      this.setState({
        snapColumnSpace: snapColumnSpace,
        snapRowSpace: snapRowSpace,
      });
    }
  }

  renderChildWidget(childWidgetData: WidgetProps) {
    childWidgetData.parentColumnSpace = this.state.snapColumnSpace;
    childWidgetData.parentRowSpace = this.state.snapRowSpace;
    const widgetFunctions: WidgetFunctions = this.props as WidgetFunctions;
    return WidgetFactory.createWidget(
      childWidgetData,
      widgetFunctions,
      this.props.renderMode,
    );
  }

  getPageView() {
    return (
      <ContainerComponent
        widgetId={this.props.widgetId}
        style={{
          ...this.getPositionStyle(),
        }}
        orientation={this.props.orientation || "VERTICAL"}
      >
        {_.map(this.props.children, this.renderChildWidget)}
      </ContainerComponent>
    );
  }

  getCanvasView() {
    return (
      <DropTargetComponent
        {...this.props}
        style={{
          ...this.getPositionStyle(),
        }}
      >
        {super.getCanvasView()}
      </DropTargetComponent>
    );
  }

  getWidgetType(): WidgetType {
    return "CONTAINER_WIDGET";
  }
}

export interface ContainerWidgetState extends WidgetState {
  snapColumnSpace: number;
  snapRowSpace: number;
}

export interface ContainerWidgetProps<T extends WidgetProps>
  extends WidgetProps {
  children?: T[];
  snapColumns?: number;
  snapRows?: number;
  orientation?: ContainerOrientation;
  backgroundColor?: Color;
}

export default ContainerWidget;
