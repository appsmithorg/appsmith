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
import React, { Component } from "react";
import { BaseStyle } from "../components/designSystems/appsmith/BaseComponent";
import _ from "lodash";
import DraggableComponent from "../components/editorComponents/DraggableComponent";
import ResizableComponent from "../components/editorComponents/ResizableComponent";
import { ActionPayload } from "../constants/ActionConstants";
import { WidgetFunctionsContext } from "../pages/Editor/WidgetsEditor";
import shallowequal from "shallowequal";

abstract class BaseWidget<
  T extends WidgetProps,
  K extends WidgetState
> extends Component<T, K> {
  constructor(props: T) {
    super(props);
    const initialState: WidgetState = {
      componentHeight: 0,
      componentWidth: 0,
    };
    initialState.componentHeight = 0;
    initialState.componentWidth = 0;
    this.state = initialState as K;
  }

  static contextType = WidgetFunctionsContext;

  executeAction(actionPayloads?: ActionPayload[]): void {
    const { executeAction } = this.context;
    executeAction && executeAction(actionPayloads);
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
      componentWidth: (rightColumn - leftColumn) * parentColumnSpace,
      componentHeight: (bottomRow - topRow) * parentRowSpace,
    };
    if (
      _.isNil(this.state) ||
      widgetState.componentHeight !== this.state.componentHeight ||
      widgetState.componentWidth !== this.state.componentWidth
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
      case RenderModes.PAGE:
        return this.getPageView();
      default:
        return this.getPageView();
    }
  }

  abstract getPageView(): JSX.Element;

  getCanvasView(): JSX.Element {
    const style = this.getPositionStyle();
    if (!this.props.parentId) {
      return this.getPageView();
    } else {
      return (
        <DraggableComponent
          {...this.props}
          style={{ ...style }}
          orientation={"VERTICAL"}
        >
          <ResizableComponent style={{ ...style }} {...this.props}>
            {this.getPageView()}
          </ResizableComponent>
        </DraggableComponent>
      );
    }
  }

  shouldComponentUpdate(nextProps: WidgetProps, nextState: WidgetState) {
    const isNotEqual =
      !shallowequal(nextProps, this.props) ||
      !shallowequal(nextState, this.state);
    return isNotEqual;
  }

  abstract getWidgetType(): WidgetType;

  getPositionStyle(): BaseStyle {
    return {
      positionType: "ABSOLUTE",
      componentHeight: this.state.componentHeight,
      componentWidth: this.state.componentWidth,
      yPosition: this.props.topRow * this.props.parentRowSpace,
      xPosition: this.props.leftColumn * this.props.parentColumnSpace,
      xPositionUnit: CSSUnits.PIXEL,
      yPositionUnit: CSSUnits.PIXEL,
      backgroundColor: this.props.backgroundColor,
    };
  }

  static defaultProps: Partial<WidgetProps> = {
    parentRowSpace: 1,
    parentColumnSpace: 1,
    topRow: 0,
    leftColumn: 0,
  };
}

export interface WidgetState {
  componentHeight: number;
  componentWidth: number;
}

export interface WidgetBuilder<T extends WidgetProps> {
  buildWidget(widgetProps: T): JSX.Element;
}

export interface WidgetProps extends WidgetDataProps {
  key?: string;
  renderMode: RenderMode;
}

export interface WidgetDataProps {
  widgetId: string;
  type: WidgetType;
  widgetName: string;
  topRow: number;
  leftColumn: number;
  bottomRow: number;
  rightColumn: number;
  parentColumnSpace: number;
  parentRowSpace: number;
  isVisible?: boolean;
  parentId?: string;
  backgroundColor?: string;
}

export interface WidgetFunctions {
  executeAction?: (actionPayloads?: ActionPayload[]) => void;
  updateWidget?: Function;
  updateWidgetProperty?: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
}

export interface WidgetCardProps {
  type: WidgetType;
  key?: string;
  widgetCardName: string;
  icon: string;
}

export const WidgetOperations = {
  // WidgetActivities?
  MOVE: "MOVE",
  RESIZE: "RESIZE",
  ADD_CHILD: "ADD_CHILD",
  REMOVE_CHILD: "REMOVE_CHILD",
  UPDATE_PROPERTY: "UPDATE_PROPERTY",
  DELETE: "DELETE",
};

export type WidgetOperation = (typeof WidgetOperations)[keyof typeof WidgetOperations];

export default BaseWidget;
