/***
 * Widget are responsible for accepting the abstraction layer inputs, interpretting them into rederable props and
 * spawing components based on those props
 * Widgets are also responsible for dispatching actions and updating the state tree
 */
import {
  WidgetType,
  RenderMode,
  RenderModes,
  CSSUnits,
} from "../constants/WidgetConstants";
import { Component } from "react";
import { BaseStyle } from "../editorComponents/BaseComponent";
import _ from "lodash";
import React from "react";
import DraggableComponent from "../editorComponents/DraggableComponent";

abstract class BaseWidget<
  T extends WidgetProps,
  K extends WidgetState
> extends Component<T, K> {
  constructor(props: T) {
    super(props);
    const initialState: WidgetState = {
      height: 0,
      width: 0,
    };
    initialState.height = 0;
    initialState.width = 0;
    this.state = initialState as K;
  }

  componentDidMount(): void {
    this.calculateWidgetBounds(
      this.props.rightColumn,
      this.props.leftColumn,
      this.props.topRow,
      this.props.bottomRow,
      this.props.parentColumnSpace,
      this.props.parentRowSpace,
    );
  }
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidUpdate(prevProps: T) {
    this.calculateWidgetBounds(
      this.props.rightColumn,
      this.props.leftColumn,
      this.props.topRow,
      this.props.bottomRow,
      this.props.parentColumnSpace,
      this.props.parentRowSpace,
    );
  }

  calculateWidgetBounds(
    rightColumn: number,
    leftColumn: number,
    topRow: number,
    bottomRow: number,
    parentColumnSpace: number,
    parentRowSpace: number,
  ) {
    const widgetState: WidgetState = {
      width: (rightColumn - leftColumn) * parentColumnSpace,
      height: (bottomRow - topRow) * parentRowSpace,
    };
    if (
      _.isNil(this.state) ||
      widgetState.height !== this.state.height ||
      widgetState.width !== this.state.width
    ) {
      this.setState(widgetState);
    }
  }

  render() {
    return this.getWidgetView();
  }

  getWidgetView(): JSX.Element {
    switch (this.props.renderMode) {
      case RenderModes.CANVAS:
        return this.getCanvasView();
      case RenderModes.COMPONENT_PANE:
        return this.getComponentPaneView();
      case RenderModes.PAGE:
        return this.getPageView();
      default:
        return this.getPageView();
    }
  }

  abstract getPageView(): JSX.Element;

  getCanvasView(): JSX.Element {
    return this.getPageView();
  }

  getComponentPaneView(): JSX.Element {
    return (
      <DraggableComponent
        {...this.props}
        style={{
          ...this.getPositionStyle(),
        }}
        orientation={"VERTICAL"}
      >
        {this.getPageView()}
      </DraggableComponent>
    );
  }

  abstract getWidgetType(): WidgetType;

  getPositionStyle(): BaseStyle {
    return {
      positionType:
        this.props.renderMode !== RenderModes.PAGE
          ? "CONTAINER_DIRECTION"
          : "ABSOLUTE",
      height: this.state.height,
      width: this.state.width,
      yPosition: this.props.topRow * this.props.parentRowSpace,
      xPosition: this.props.leftColumn * this.props.parentColumnSpace,
      xPositionUnit: CSSUnits.PIXEL,
      yPositionUnit: CSSUnits.PIXEL,
    };
  }

  static defaultProps: Partial<WidgetProps> = {
    parentRowSpace: 64,
    parentColumnSpace: 64,
    topRow: 0,
    leftColumn: 0,
  };
}

export interface WidgetState {
  height: number;
  width: number;
}

export interface DraggableWidget {
  type: string;
  widget: WidgetProps;
  key: string;
}

export interface WidgetBuilder<T extends WidgetProps> {
  buildWidget(data: T): JSX.Element;
}

export interface WidgetProps {
  widgetId: string;
  type: WidgetType;
  widgetName: string;
  key?: string;
  topRow: number;
  leftColumn: number;
  bottomRow: number;
  rightColumn: number;
  parentColumnSpace: number;
  parentRowSpace: number;
  renderMode: RenderMode;
  isVisible?: boolean;
}

export interface WidgetCardProps {
  type: WidgetType;
  key?: string;
  label: string;
  icon: string;
}

export const WidgetDynamicProperties = {
  POSITION: "POSITION",
  SIZE: "SIZE",
  CHILDREN: "CHILDREN",
  EXISTENCE: "EXISTENCE",
};

export type WidgetDynamicProperty = (typeof WidgetDynamicProperties)[keyof typeof WidgetDynamicProperties];

export default BaseWidget;
