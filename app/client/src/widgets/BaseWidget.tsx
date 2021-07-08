/**
 * Widget are responsible for accepting the abstraction layer inputs, interpretting them into rederable props and
 * spawing components based on those props
 * Widgets are also responsible for dispatching actions and updating the state tree
 */
import {
  CONTAINER_GRID_PADDING,
  CSSUnit,
  CSSUnits,
  PositionType,
  PositionTypes,
  RenderMode,
  RenderModes,
  WidgetType,
} from "constants/WidgetConstants";
import React, { Component, ReactNode } from "react";
import { get, memoize } from "lodash";
import DraggableComponent from "components/editorComponents/DraggableComponent";
import ResizableComponent from "components/editorComponents/ResizableComponent";
import { WidgetExecuteActionPayload } from "constants/AppsmithActionConstants/ActionConstants";
import PositionedContainer from "components/designSystems/appsmith/PositionedContainer";
import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";

import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  DataTreeEvaluationProps,
  EVAL_ERROR_PATH,
  EvaluationError,
  PropertyEvaluationErrorType,
  WidgetDynamicPathListProps,
} from "utils/DynamicBindingUtils";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import {
  BatchPropertyUpdatePayload,
  batchUpdateWidgetProperty,
  deleteWidgetProperty,
} from "actions/controlActions";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { disableDragAction, executeAction } from "actions/widgetActions";
import { updateWidget } from "actions/pageActions";
import { resetChildrenMetaProperty } from "actions/metaActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getDisplayName } from "./WidgetUtils";
import { makeGetWidgetProps } from "selectors/editorSelectors";
import OverlayCommentsWrapper from "comments/inlineComments/OverlayCommentsWrapper";
import PreventInteractionsOverlay from "components/editorComponents/PreventInteractionsOverlay";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

abstract class BaseWidget<
  T extends WidgetProps,
  K extends WidgetState
> extends Component<T, K> {
  static displayName: string;
  static getPropertyPaneConfig(): PropertyPaneConfig[] {
    return [];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, any> {
    return {};
  }
  // TODO Find a way to enforce this, (dont let it be set)
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getWidgetType(): string {
    return "SKELETON_WIDGET";
  }
}

export default BaseWidget;
/***
 * BaseWidget
 *
 * The class which is extended by all widgets.
 * Widgets must adhere to the abstractions provided by BaseWidget.
 *
 * Do not:
 * 1) Use the context directly in the widgets
 * 2) Update or access the dsl in the widgets
 * 3) Call actions in widgets or connect the widgets to the entity reducers
 *
 */
export function withWidgetAPI(Widget: typeof BaseWidget) {
  class WidgetWrapper extends BaseWidget<WidgetProps, any> {
    getComponentDimensions = (): {
      componentWidth: number;
      componentHeight: number;
    } => {
      return {
        componentWidth:
          (this.props.rightColumn - this.props.leftColumn) *
          this.props.parentColumnSpace,
        componentHeight:
          (this.props.bottomRow - this.props.topRow) *
          this.props.parentRowSpace,
      };
    };
    static displayName: string;

    render() {
      console.log("Connected Widget, Rendering Widget......");
      return this.getWidgetView(<Widget {...this.props} />);
    }

    getErrorCount = memoize((evalErrors: Record<string, EvaluationError[]>) => {
      return Object.values(evalErrors).reduce(
        (prev, curr) =>
          curr.filter(
            (error) => error.errorType !== PropertyEvaluationErrorType.LINT,
          ).length + prev,
        0,
      );
    }, JSON.stringify);

    /**
     * this function is responsive for making the widget resizable.
     * A widget can be made by non-resizable by passing resizeDisabled prop.
     *
     * @param content
     */
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

    /**
     * this functions wraps the widget in a component that shows a setting control at the top right
     * which gets shown on hover. A widget can enable/disable this by setting `disablePropertyPane` prop
     *
     * @param content
     * @param showControls
     */
    showWidgetName(content: ReactNode, showControls = false) {
      return (
        <>
          {!this.props.disablePropertyPane && (
            <WidgetNameComponent
              errorCount={this.getErrorCount(
                get(this.props, EVAL_ERROR_PATH, {}),
              )}
              parentId={this.props.parentId}
              showControls={showControls}
              topRow={this.props.detachFromLayout ? 4 : this.props.topRow}
              type={this.props.type}
              widgetId={this.props.widgetId}
              widgetName={this.props.widgetName}
            />
          )}
          {content}
        </>
      );
    }

    /**
     * wraps the widget in a draggable component.
     * Note: widget drag can be disabled by setting `dragDisabled` prop to true
     *
     * @param content
     */
    makeDraggable(content: ReactNode) {
      return <DraggableComponent {...this.props}>{content}</DraggableComponent>;
    }

    makePositioned(content: ReactNode) {
      const style = this.getPositionStyle();
      return (
        <PositionedContainer
          focused={this.props.focused}
          resizeDisabled={this.props.resizeDisabled}
          selected={this.props.selected}
          style={style}
          widgetId={this.props.widgetId}
          widgetType={this.props.type}
        >
          {content}
        </PositionedContainer>
      );
    }

    addErrorBoundary(content: ReactNode) {
      return <ErrorBoundary>{content}</ErrorBoundary>;
    }

    /**
     * These comments are rendered using position: absolute over the widget borders,
     * they are not aware of the component structure.
     * For additional component specific contexts, for eg.
     * a comment bound to the scroll position or a specific section
     * we would pass comments as props to the components
     */
    addOverlayComments(content: ReactNode) {
      return (
        <OverlayCommentsWrapper refId={this.props.widgetId}>
          {content}
        </OverlayCommentsWrapper>
      );
    }

    addPreventInteractionOverlay(content: ReactNode) {
      return (
        <PreventInteractionsOverlay widgetType={this.props.type}>
          {content}
        </PreventInteractionsOverlay>
      );
    }

    private getWidgetView(content: ReactNode): ReactNode {
      switch (this.props.renderMode) {
        case RenderModes.CANVAS:
          content = this.addPreventInteractionOverlay(content);
          content = this.addOverlayComments(content);
          if (!this.props.detachFromLayout) {
            if (!this.props.resizeDisabled)
              content = this.makeResizable(content);
            content = this.showWidgetName(content);
            content = this.makeDraggable(content);
            content = this.makePositioned(content);
          }
          return content;
        case RenderModes.PAGE:
          if (this.props.isVisible) {
            content = this.addPreventInteractionOverlay(content);
            content = this.addOverlayComments(content);
            content = this.addErrorBoundary(content);
            if (!this.props.detachFromLayout) {
              content = this.makeResizable(content);
              content = this.showWidgetName(content);
              content = this.makeDraggable(content);
              content = this.makePositioned(content);
            }
            return content;
          }
          return null;
        default:
          throw Error("RenderMode not defined");
      }
    }

    // TODO(abhinav): Maybe make this a pure component to bailout from updating altogether.
    // This would involve making all widgets which have "states" to not have states,
    // as they're extending this one.
    // shouldComponentUpdate(nextProps: WidgetProps): boolean {
    //   const start = performance.now();
    //   const isDifferent =
    //     JSON.stringify(nextProps) !== JSON.stringify(this.props);
    //   console.log(
    //     "Connected Widgets prop diff calculations took",
    //     performance.now() - start,
    //     "ms",
    //     "widget",
    //     this.props,
    //     "are they different",
    //     isDifferent,
    //   );
    //   return isDifferent;
    //   // return (
    //   //   !shallowequal(nextProps, this.props) ||
    //   //   !shallowequal(nextState, this.state)
    //   // );
    // }

    /**
     * generates styles that positions the widget
     */
    private getPositionStyle(): BaseStyle {
      const { componentHeight, componentWidth } = this.getComponentDimensions();

      return {
        positionType: PositionTypes.ABSOLUTE,
        componentHeight,
        componentWidth,
        yPosition:
          this.props.topRow * this.props.parentRowSpace +
          (this.props.noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
        xPosition:
          this.props.leftColumn * this.props.parentColumnSpace +
          (this.props.noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
        xPositionUnit: CSSUnits.PIXEL,
        yPositionUnit: CSSUnits.PIXEL,
      };
    }
  }
  WidgetWrapper.displayName = `WidgetWithAPI(${getDisplayName(Widget)})`;

  (WidgetWrapper as any).whyDidYouRender = {
    logOnDifferentValues: false,
  };
  return connect(makeMapStateToProps, mapDispatchToProps)(WidgetWrapper);
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
export interface WidgetBuilder<WidgetSkeleton> {
  buildWidget(widgetProps: WidgetSkeleton): JSX.Element;
}

export interface WidgetBaseProps {
  widgetId: string;
  type: WidgetType;
  widgetName: string;
  parentId?: string;
  renderMode: RenderMode;
  version: number;
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
  noContainerOffset?: boolean; // This won't offset the child in parent
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
  noContainerOffset: false,
};

export const WIDGET_DISPLAY_PROPS = {
  isVisible: true,
  isLoading: true,
  isDisabled: true,
  backgroundColor: true,
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

export interface WidgetProps
  extends WidgetDataProps,
    WidgetDynamicPathListProps,
    DataTreeEvaluationProps {
  key?: string;
  isDefaultClickDisabled?: boolean;
  [key: string]: any;
}

export interface WidgetCardProps {
  type: WidgetType;
  key?: string;
  displayName: string;
  icon: string;
  isBeta?: boolean;
}

export const WidgetOperations = {
  MOVE: "MOVE",
  RESIZE: "RESIZE",
  ADD_CHILD: "ADD_CHILD",
  UPDATE_PROPERTY: "UPDATE_PROPERTY",
  DELETE: "DELETE",
  ADD_CHILDREN: "ADD_CHILDREN",
};

export type WidgetSkeleton = {
  widgetId: string;
  type: WidgetType;
  parentId?: string;
  children?: Array<WidgetSkeleton>;
};

export type WidgetOperation = typeof WidgetOperations[keyof typeof WidgetOperations];
// const mapStateToProps = getWidgetProps;
const makeMapStateToProps = () => {
  const getWidgetProps = makeGetWidgetProps();
  const mapStateToProps = (state: AppState, props: { widgetId: string }) => {
    return getWidgetProps(state, props);
  };
  return mapStateToProps;
};

const mapDispatchToProps = (dispatch: any, ownProps: { widgetId: string }) => ({
  executeAction: (actionPayload: WidgetExecuteActionPayload): void => {
    actionPayload.triggerPropertyName &&
      AppsmithConsole.info({
        text: `${actionPayload.triggerPropertyName} triggered`,
        source: {
          type: ENTITY_TYPE.WIDGET,
          id: this.props.widgetId,
          name: this.props.widgetName,
        },
      });
    dispatch(executeAction(actionPayload));
  },
  disableDrag: (disable: boolean) => {
    disable !== undefined && dispatch(disableDragAction(disable));
  },
  updateWidget: (
    operationName: string,
    widgetId: string,
    widgetProperties: any,
  ) => {
    dispatch(updateWidget(operationName, widgetId, widgetProperties));
  },
  deleteWidgetProperty: (propertyPaths: string[]) => {
    if (ownProps.widgetId) {
      dispatch(deleteWidgetProperty(ownProps.widgetId, propertyPaths));
    }
  },
  batchUpdateWidgetProperty: (updates: BatchPropertyUpdatePayload) => {
    if (ownProps.widgetId) {
      dispatch(batchUpdateWidgetProperty(ownProps.widgetId, updates));
    }
  },
  updateWidgetProperty: (propertyName: string, propertyValue: any) => {
    if (ownProps.widgetId) {
      dispatch(
        batchUpdateWidgetProperty(ownProps.widgetId, {
          modify: { [propertyName]: propertyValue },
        }),
      );
    }
  },
  resetChildrenMetaProperty: (widgetId: string) => {
    dispatch(resetChildrenMetaProperty(widgetId));
  },
  showPropertyPane: (
    widgetId?: string,
    callForDragOrResize?: boolean,
    force = false,
  ) => {
    dispatch({
      type:
        widgetId || callForDragOrResize
          ? ReduxActionTypes.SHOW_PROPERTY_PANE
          : ReduxActionTypes.HIDE_PROPERTY_PANE,
      payload: { widgetId, callForDragOrResize, force },
    });
  },
});
