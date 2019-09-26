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
import DraggableComponent from "../editorComponents/DraggableComponent";
import ResizableComponent from "../editorComponents/ResizableComponent";

const { DEFAULT_GRID_COLUMNS, DEFAULT_GRID_ROWS } = GridDefaults;

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
    };
  }

  componentDidUpdate(previousProps: ContainerWidgetProps<WidgetProps>) {
    super.componentDidUpdate(previousProps);
    let snapColumnSpace = this.state.snapColumnSpace;
    let snapRowSpace = this.state.snapRowSpace;
    if (this.state.componentWidth)
      snapColumnSpace = Math.floor(
        this.state.componentWidth /
          (this.props.snapColumns || DEFAULT_GRID_COLUMNS),
      );
    if (this.state.componentHeight)
      snapRowSpace = Math.floor(
        this.state.componentHeight / (this.props.snapRows || DEFAULT_GRID_ROWS),
      );
    if (
      this.state.snapColumnSpace !== snapColumnSpace ||
      this.state.snapRowSpace !== snapRowSpace
    ) {
      this.setState({
        snapColumnSpace,
        snapRowSpace,
      });
    }
  }

  renderChildWidget(childWidgetData: WidgetProps) {
    childWidgetData.parentColumnSpace = this.state.snapColumnSpace;
    childWidgetData.parentRowSpace = this.state.snapRowSpace;
    childWidgetData.parentId = this.props.widgetId;
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
    const style = this.getPositionStyle();
    const occupiedSpaces: OccupiedSpace[] | null = this.props.children
      ? this.props.children.map(child => ({
          id: child.widgetId,
          left: child.leftColumn,
          top: child.topRow,
          bottom: child.bottomRow,
          right: child.rightColumn,
        }))
      : null;
    return (
      <DropTargetComponent
        {...this.props}
        {...this.state}
        occupiedSpaces={occupiedSpaces}
        style={{
          ...style,
        }}
      >
        <DraggableComponent
          style={{ ...style, xPosition: 0, yPosition: 0 }}
          {...this.props}
          orientation={"VERTICAL"}
        >
          <ResizableComponent style={{ ...style }} {...this.props}>
            {this.getPageView()}
          </ResizableComponent>
        </DraggableComponent>
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

export type OccupiedSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
};

export default ContainerWidget;
