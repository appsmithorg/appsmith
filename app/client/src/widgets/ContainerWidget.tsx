import React from "react";
import _ from "lodash";

import ContainerComponent, {
  ContainerStyle,
  ContainerComponentProps,
} from "components/designSystems/appsmith/ContainerComponent";
import { ContainerOrientation, WidgetType } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import { Color } from "constants/Colors";
import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import {
  GridDefaults,
  CONTAINER_GRID_PADDING,
  WIDGET_PADDING,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";

import ResizeBoundsContainerComponent from "components/editorComponents/ResizeBoundsContainerComponent";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";

const { DEFAULT_GRID_COLUMNS, DEFAULT_GRID_ROW_HEIGHT } = GridDefaults;
class ContainerWidget extends BaseWidget<
  ContainerWidgetProps<WidgetProps>,
  ContainerWidgetState
> {
  constructor(props: ContainerWidgetProps<WidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
    this.state = {
      componentWidth: 0,
      componentHeight: 0,
      snapColumnSpace: 0,
      snapRowSpace: 0,
      meta: {},
    };
  }

  componentDidUpdate(previousProps: ContainerWidgetProps<WidgetProps>) {
    super.componentDidUpdate(previousProps);
    let snapColumnSpace = this.state.snapColumnSpace;
    if (this.state.componentWidth)
      snapColumnSpace =
        (this.state.componentWidth -
          (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2) /
        (this.props.snapColumns || DEFAULT_GRID_COLUMNS);
    if (this.state.snapColumnSpace !== snapColumnSpace) {
      this.setState({
        snapColumnSpace,
        snapRowSpace: DEFAULT_GRID_ROW_HEIGHT,
      });
    }
  }

  renderChildWidget(childWidgetData: WidgetProps): JSX.Element {
    childWidgetData.parentColumnSpace = this.state.snapColumnSpace;
    childWidgetData.parentRowSpace = this.state.snapRowSpace;
    childWidgetData.parentId = this.props.widgetId;
    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  }

  renderChildren = () => {
    return _.map(this.props.children, this.renderChildWidget);
  };

  renderAsDropTarget() {
    return (
      <DropTargetComponent {...this.props} {...this.state}>
        <ResizeBoundsContainerComponent {...this.props}>
          {this.renderChildren()}
        </ResizeBoundsContainerComponent>
      </DropTargetComponent>
    );
  }

  getContainerComponentProps = (): ContainerComponentProps => ({
    ...this.props,
    isMainContainer: this.props.widgetId === MAIN_CONTAINER_WIDGET_ID,
    backgroundColor: this.props.backgroundColor || "white",
  });

  renderAsContainerComponent() {
    return (
      <ContainerComponent {...this.getContainerComponentProps()}>
        {this.renderChildren()}
      </ContainerComponent>
    );
  }

  getPageView() {
    return this.renderAsContainerComponent();
  }

  getCanvasView() {
    return this.renderAsDropTarget();
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
  containerStyle?: ContainerStyle;
}

export default ContainerWidget;
