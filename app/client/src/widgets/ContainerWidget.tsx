import React, { createContext, Context } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import ContainerComponent from "../components/designSystems/appsmith/ContainerComponent";
import { ContainerOrientation, WidgetType } from "../constants/WidgetConstants";
import WidgetFactory from "../utils/WidgetFactory";
import _ from "lodash";
import { Color } from "../constants/Colors";
import DropTargetComponent from "../components/editorComponents/DropTargetComponent";
import { GridDefaults } from "../constants/WidgetConstants";
import DraggableComponent from "../components/editorComponents/DraggableComponent";
import ResizableComponent from "../components/editorComponents/ResizableComponent";

const { DEFAULT_GRID_COLUMNS, DEFAULT_GRID_ROW_HEIGHT } = GridDefaults;
export const OccupiedSpaceContext: Context<
  OccupiedSpace[] | any
> = createContext(null);

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
    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
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
    const renderComponent = (
      <DropTargetComponent
        {...this.props}
        {...this.state}
        style={{
          ...style,
        }}
        isRoot={!this.props.parentId}
      >
        <OccupiedSpaceContext.Provider value={occupiedSpaces}>
          {this.getPageView()}
        </OccupiedSpaceContext.Provider>
      </DropTargetComponent>
    );
    const renderDraggableComponent = (
      <DraggableComponent
        style={{ ...style }}
        {...this.props}
        orientation={"VERTICAL"}
      >
        <ResizableComponent style={{ ...style }} {...this.props}>
          <OccupiedSpaceContext.Provider value={occupiedSpaces}>
            {renderComponent}
          </OccupiedSpaceContext.Provider>
        </ResizableComponent>
      </DraggableComponent>
    );
    return this.props.parentId ? renderDraggableComponent : renderComponent;
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
