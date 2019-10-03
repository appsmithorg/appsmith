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
    };
  }

  componentDidUpdate(previousProps: ContainerWidgetProps<WidgetProps>) {
    super.componentDidUpdate(previousProps);
    let snapColumnSpace = this.state.snapColumnSpace;
    if (this.state.componentWidth)
      snapColumnSpace = Math.floor(
        this.state.componentWidth /
          (this.props.snapColumns || DEFAULT_GRID_COLUMNS),
      );
    if (this.state.snapColumnSpace !== snapColumnSpace) {
      this.setState({
        snapColumnSpace,
        snapRowSpace: DEFAULT_GRID_ROW_HEIGHT,
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
        isRoot={!this.props.parentId}
        orientation={this.props.orientation || "VERTICAL"}
        widgetName={this.props.widgetName}
      >
        {_.map(this.props.children, this.renderChildWidget)}
      </ContainerComponent>
    );
  }

  getOccupiedSpaces(): OccupiedSpace[] | null {
    return this.props.children
      ? this.props.children.map(child => ({
          id: child.widgetId,
          parentId: this.props.widgetId,
          left: child.leftColumn,
          top: child.topRow,
          bottom: child.bottomRow,
          right: child.rightColumn,
        }))
      : null;
  }
  getCanvasView() {
    const style = this.getPositionStyle();
    const occupiedSpaces = this.getOccupiedSpaces();
    const renderDraggableComponent = (
      <DraggableComponent
        style={{ ...style, xPosition: 0, yPosition: 0 }}
        {...this.props}
        orientation={"VERTICAL"}
      >
        <ResizableComponent style={{ ...style }} {...this.props}>
          {this.getPageView()}
        </ResizableComponent>
      </DraggableComponent>
    );

    return (
      <DropTargetComponent
        {...this.props}
        {...this.state}
        occupiedSpaces={occupiedSpaces}
        style={{
          ...style,
        }}
      >
        {this.props.parentId ? renderDraggableComponent : this.getPageView()}
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
  parentId?: string;
};

export default ContainerWidget;
