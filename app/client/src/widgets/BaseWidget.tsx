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
import React, { Component, ReactNode } from "react";
import {
  PositionType,
  CSSUnit,
  CONTAINER_GRID_PADDING,
} from "constants/WidgetConstants";
import _ from "lodash";
import DraggableComponent from "components/editorComponents/DraggableComponent";
import ResizableComponent from "components/editorComponents/ResizableComponent";
import { ExecuteActionPayload } from "constants/ActionConstants";
import PositionedContainer from "components/designSystems/appsmith/PositionedContainer";
import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import shallowequal from "shallowequal";
import { PositionTypes } from "constants/WidgetConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/ValidationFactory";
import {
  DerivedPropertiesMap,
  TriggerPropertiesMap,
} from "utils/WidgetFactory";

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
  static contextType = EditorContext;

  // Needed to send a default no validation option. In case a widget needs
  // validation implement this in the widget class again
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return BASE_WIDGET_VALIDATION;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
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
  executeAction(actionPayload: ExecuteActionPayload): void {
    const { executeAction } = this.context;
    executeAction && executeAction(actionPayload);
  }

  disableDrag(disable: boolean) {
    const { disableDrag } = this.context;
    disableDrag && disable !== undefined && disableDrag(disable);
  }

  updateWidget(
    operationName: string,
    widgetId: string,
    widgetProperties: any,
  ): void {
    const { updateWidget } = this.context;
    updateWidget && updateWidget(operationName, widgetId, widgetProperties);
  }

  updateWidgetProperty(propertyName: string, propertyValue: any): void {
    const { updateWidgetProperty } = this.context;
    const { widgetId } = this.props;
    updateWidgetProperty &&
      updateWidgetProperty(widgetId, propertyName, propertyValue);
  }

  resetChildrenMetaProperty(widgetId: string) {
    const { resetChildrenMetaProperty } = this.context;
    resetChildrenMetaProperty(widgetId);
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  componentDidUpdate(prevProps: T) {}

  componentDidMount(): void {}
  /* eslint-enable @typescript-eslint/no-empty-function */

  getComponentDimensions = () => {
    return this.calculateWidgetBounds(
      this.props.rightColumn,
      this.props.leftColumn,
      this.props.topRow,
      this.props.bottomRow,
      this.props.parentColumnSpace,
      this.props.parentRowSpace,
    );
  };

  calculateWidgetBounds(
    rightColumn: number,
    leftColumn: number,
    topRow: number,
    bottomRow: number,
    parentColumnSpace: number,
    parentRowSpace: number,
  ): {
    componentWidth: number;
    componentHeight: number;
  } {
    return {
      componentWidth: (rightColumn - leftColumn) * parentColumnSpace,
      componentHeight: (bottomRow - topRow) * parentRowSpace,
    };
  }

  render() {
    return this.getWidgetView();
  }

  makeResizable(content: ReactNode) {
    return (
      <ResizableComponent
        {...this.props}
        paddingOffset={PositionedContainer.padding}
      >
        {content}
      </ResizableComponent>
    );
  }
  showWidgetName(content: ReactNode, showControls = false) {
    return (
      <React.Fragment>
        <WidgetNameComponent
          widgetName={this.props.widgetName}
          widgetId={this.props.widgetId}
          parentId={this.props.parentId}
          type={this.props.type}
          showControls={showControls}
        />
        {content}
      </React.Fragment>
    );
  }

  makeDraggable(content: ReactNode) {
    return <DraggableComponent {...this.props}>{content}</DraggableComponent>;
  }

  makePositioned(content: ReactNode) {
    const style = this.getPositionStyle();
    return (
      <PositionedContainer
        widgetId={this.props.widgetId}
        widgetType={this.props.type}
        style={style}
      >
        {content}
      </PositionedContainer>
    );
  }

  addErrorBoundary(content: ReactNode, isValid: boolean) {
    return <ErrorBoundary isValid={isValid}>{content}</ErrorBoundary>;
  }

  private getWidgetView(): ReactNode {
    let content: ReactNode;
    switch (this.props.renderMode) {
      case RenderModes.CANVAS:
        content = this.getCanvasView();
        if (!this.props.detachFromLayout) {
          content = this.makeResizable(content);
          content = this.showWidgetName(content);
          content = this.makeDraggable(content);
          content = this.makePositioned(content);
        }
        return content;

      // return this.getCanvasView();
      case RenderModes.PAGE:
        content = this.getPageView();
        if (this.props.isVisible) {
          content = this.addErrorBoundary(content, true);
          if (!this.props.detachFromLayout) {
            content = this.makePositioned(content);
          }
          return content;
        }
        return <React.Fragment />;
      default:
        throw Error("RenderMode not defined");
    }
  }

  abstract getPageView(): ReactNode;

  getCanvasView(): ReactNode {
    let isValid = true;
    if (this.props.invalidProps) {
      isValid = _.keys(this.props.invalidProps).length === 0;
    }
    if (this.props.isLoading) isValid = true;
    const content = this.getPageView();
    return this.addErrorBoundary(content, isValid);
  }

  // TODO(abhinav): Maybe make this a pure component to bailout from updating altogether.
  // This would involve making all widgets which have "states" to not have states,
  // as they're extending this one.
  shouldComponentUpdate(nextProps: WidgetProps, nextState: WidgetState) {
    return (
      !shallowequal(nextProps, this.props) ||
      !shallowequal(nextState, this.state)
    );
  }

  private getPositionStyle(): BaseStyle {
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    return {
      positionType: PositionTypes.ABSOLUTE,
      componentHeight,
      componentWidth,
      yPosition:
        this.props.topRow * this.props.parentRowSpace + CONTAINER_GRID_PADDING,
      xPosition:
        this.props.leftColumn * this.props.parentColumnSpace +
        CONTAINER_GRID_PADDING,
      xPositionUnit: CSSUnits.PIXEL,
      yPositionUnit: CSSUnits.PIXEL,
    };
  }

  // TODO(abhinav): These defaultProps seem unneccessary. Check it out.
  static defaultProps: Partial<WidgetProps> | undefined = {
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

export type WidgetState = Record<string, unknown>;

export interface WidgetBuilder<T extends WidgetProps, S extends WidgetState> {
  buildWidget(widgetProps: T): JSX.Element;
}

export interface WidgetBaseProps {
  widgetId: string;
  type: WidgetType;
  widgetName: string;
  parentId: string;
  renderMode: RenderMode;
}

export type WidgetRowCols = {
  leftColumn: number;
  rightColumn: number;
  topRow: number;
  bottomRow: number;
  minHeight?: number; // Required to reduce the size of CanvasWidgets.
};

export interface WidgetPositionProps extends WidgetRowCols {
  parentColumnSpace: number;
  parentRowSpace: number;
  // The detachFromLayout flag tells use about the following properties when enabled
  // 1) Widget does not drag/resize
  // 2) Widget CAN (but not neccessarily) be a dropTarget
  // Examples: MainContainer is detached from layout,
  // MODAL_WIDGET is also detached from layout.
  detachFromLayout?: boolean;
}

export const WIDGET_STATIC_PROPS = {
  leftColumn: true,
  rightColumn: true,
  topRow: true,
  bottomRow: true,
  minHeight: true,
  parentColumnSpace: true,
  parentRowSpace: true,
  children: true,
  type: true,
  widgetId: true,
  widgetName: true,
  parentId: true,
  renderMode: true,
  detachFromLayout: true,
};

export interface WidgetDisplayProps {
  //TODO(abhinav): Some of these props are mandatory
  isVisible?: boolean;
  isLoading: boolean;
  isDisabled?: boolean;
  backgroundColor?: string;
}

export interface WidgetDataProps
  extends WidgetBaseProps,
    WidgetPositionProps,
    WidgetDisplayProps {}

export interface WidgetProps extends WidgetDataProps {
  key?: string;
  dynamicBindings?: Record<string, true>;
  dynamicTriggers?: Record<string, true>;
  dynamicProperties?: Record<string, true>;
  invalidProps?: Record<string, boolean>;
  validationMessages?: Record<string, string>;
  evaluatedValues?: Record<string, any>;
  isDefaultClickDisabled?: boolean;
  [key: string]: any;
}

export interface WidgetCardProps {
  type: WidgetType;
  key?: string;
  widgetCardName: string;
}

export const WidgetOperations = {
  MOVE: "MOVE",
  RESIZE: "RESIZE",
  ADD_CHILD: "ADD_CHILD",
  UPDATE_PROPERTY: "UPDATE_PROPERTY",
  DELETE: "DELETE",
  ADD_CHILDREN: "ADD_CHILDREN",
};

export type WidgetOperation = typeof WidgetOperations[keyof typeof WidgetOperations];

export default BaseWidget;
