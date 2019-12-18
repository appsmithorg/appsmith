/**
 * Widget are responsible for accepting the abstraction layer inputs, interpretting them into rederable props and
 * spawing components based on those props
 * Widgets are also responsible for dispatching actions and updating the state tree
 */
import {
  WidgetType,
  RenderMode,
  RenderModes,
  CSSUnits,
} from "constants/WidgetConstants";
import React, { Component } from "react";
import { PositionType, CSSUnit } from "constants/WidgetConstants";
import _ from "lodash";
import DraggableComponent from "components/editorComponents/DraggableComponent";
import ResizableComponent from "components/editorComponents/ResizableComponent";
import { ActionPayload } from "constants/ActionConstants";
import PositionedContainer from "components/designSystems/appsmith/PositionedContainer";
import WidgetNameComponent from "components/designSystems/appsmith/WidgetNameComponent";
import shallowequal from "shallowequal";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { PositionTypes } from "constants/WidgetConstants";

import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
/***
 * BaseWidget
 *
 * The abstract class which is extended/implemented by all widgets.
 * Widgets must adhere to the abstractions provided by BaseWidget.
 *
 * Do not:
 * 1) Use the context directly in the widgets
 * 2) Update or access the dsl in the widgets
 * 3) Call actions in widgets or connect the widgets to the entity reducers
 *
 */
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

  static contextType = EditorContext;

  // Needed to send a default no validation option. In case a widget needs
  // validation implement this in the widget class again
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {};
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  /**
   *  Widget abstraction to register the widget type
   *  ```javascript
   *   getWidgetType() {
   *     return "MY_AWESOME_WIDGET",
   *   }
   *  ```
   */
  abstract getWidgetType(): WidgetType;

  /**
   *  Widgets can execute actions using this `executeAction` method.
   *  Triggers may be specific to the widget
   */
  executeAction(actionPayloads?: ActionPayload[]): void {
    const { executeAction } = this.context;
    executeAction && !_.isNil(actionPayloads) && executeAction(actionPayloads);
  }

  updateWidgetProperty(
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ): void {
    const { updateWidgetProperty } = this.context;
    updateWidgetProperty &&
      updateWidgetProperty(widgetId, propertyName, propertyValue);
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

  private getWidgetView(): JSX.Element {
    switch (this.props.renderMode) {
      case RenderModes.CANVAS:
        const style = this.getPositionStyle();
        if (this.props.parentId) {
          return (
            <PositionedContainer style={style}>
              <DraggableComponent {...this.props} orientation={"VERTICAL"}>
                <WidgetNameComponent
                  widgetName={this.props.widgetName}
                  widgetId={this.props.widgetId}
                />
                <ResizableComponent
                  {...this.props}
                  paddingOffset={PositionedContainer.padding}
                >
                  {this.getCanvasView()}
                </ResizableComponent>
              </DraggableComponent>
            </PositionedContainer>
          );
        }
        return (
          <PositionedContainer style={style}>
            {this.getCanvasView()}
          </PositionedContainer>
        );
      case RenderModes.PAGE:
        if (this.props.isVisible) {
          return (
            <PositionedContainer style={this.getPositionStyle()}>
              {this.getPageView()}
            </PositionedContainer>
          );
        }
        return <React.Fragment />;
      default:
        throw Error("RenderMode not defined");
    }
  }

  abstract getPageView(): JSX.Element;

  getCanvasView(): JSX.Element {
    return <ErrorBoundary>{this.getPageView()}</ErrorBoundary>;
  }

  shouldComponentUpdate(nextProps: WidgetProps, nextState: WidgetState) {
    const isNotEqual =
      !shallowequal(nextProps, this.props) ||
      !shallowequal(nextState, this.state);
    return isNotEqual;
  }

  private getPositionStyle(): BaseStyle {
    return {
      positionType: PositionTypes.ABSOLUTE,
      componentHeight: this.state.componentHeight,
      componentWidth: this.state.componentWidth,
      yPosition: this.props.topRow * this.props.parentRowSpace,
      xPosition: this.props.leftColumn * this.props.parentColumnSpace,
      xPositionUnit: CSSUnits.PIXEL,
      yPositionUnit: CSSUnits.PIXEL,
    };
  }

  static defaultProps: Partial<WidgetProps> = {
    parentRowSpace: 1,
    parentColumnSpace: 1,
    topRow: 0,
    leftColumn: 0,
  };
}

export interface BaseStyle {
  componentHeight: number;
  componentWidth: number;
  positionType: PositionType;
  xPosition: number;
  yPosition: number;
  xPositionUnit: CSSUnit;
  yPositionUnit: CSSUnit;
  heightUnit?: CSSUnit;
  widthUnit?: CSSUnit;
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
  dynamicBindings?: Record<string, boolean>;
  isLoading: boolean;
  invalidProps?: Record<string, boolean>;
  validationMessages?: Record<string, string>;
  [key: string]: any;
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
  isLoading: boolean;
  isDisabled?: boolean;
  parentId?: string;
  backgroundColor?: string;
}

export type WidgetRowCols = {
  leftColumn: number;
  rightColumn: number;
  topRow: number;
  bottomRow: number;
};

export interface WidgetCardProps {
  type: WidgetType;
  key?: string;
  widgetCardName: string;
  icon: string;
}

export const WidgetOperations = {
  MOVE: "MOVE",
  RESIZE: "RESIZE",
  ADD_CHILD: "ADD_CHILD",
  REMOVE_CHILD: "REMOVE_CHILD",
  UPDATE_PROPERTY: "UPDATE_PROPERTY",
  DELETE: "DELETE",
};

export type WidgetOperation = typeof WidgetOperations[keyof typeof WidgetOperations];

export default BaseWidget;
