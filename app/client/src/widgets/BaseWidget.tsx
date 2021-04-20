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
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import React, { Component, ReactNode } from "react";
import {
  PositionType,
  CSSUnit,
  CONTAINER_GRID_PADDING,
} from "constants/WidgetConstants";
import DraggableComponent from "components/editorComponents/DraggableComponent";
import ResizableComponent from "components/editorComponents/ResizableComponent";
import { ExecuteActionPayload } from "constants/AppsmithActionConstants/ActionConstants";
import PositionedContainer from "components/designSystems/appsmith/PositionedContainer";
import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import shallowequal from "shallowequal";
import { PositionTypes } from "constants/WidgetConstants";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  WidgetDynamicPathListProps,
  WidgetEvaluatedProps,
} from "../utils/DynamicBindingUtils";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import {
  BatchPropertyUpdatePayload,
  batchUpdateWidgetProperty,
  deleteWidgetProperty,
} from "actions/controlActions";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { findKey } from "lodash";
import { disableDragAction, executeAction } from "actions/widgetActions";
import { updateWidget } from "actions/pageActions";
import { resetChildrenMetaProperty } from "actions/metaActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getWidget } from "sagas/selectors";
import { getDisplayName } from "./WidgetUtils";

abstract class BaseWidget<
  T extends WidgetProps,
  K extends WidgetState
> extends Component<T, K> {
  static displayName: string;
  static getPropertyPaneConfig(): PropertyPaneConfig[] {
    return [];
  }
  // Needed to send a default no validation option. In case a widget needs
  // validation implement this in the widget class again
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return BASE_WIDGET_VALIDATION;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
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
      return this.getWidgetView(<Widget {...this.props} />);
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

    addErrorBoundary(content: ReactNode) {
      return <ErrorBoundary>{content}</ErrorBoundary>;
    }

    private getWidgetView(content: ReactNode): ReactNode {
      switch (this.props.renderMode) {
        case RenderModes.CANVAS:
          if (!this.props.detachFromLayout) {
            content = this.makeResizable(content);
            content = this.showWidgetName(content);
            content = this.makeDraggable(content);
            content = this.makePositioned(content);
          }
          return content;

        // return this.getCanvasView();
        case RenderModes.PAGE:
          if (this.props.isVisible) {
            content = this.addErrorBoundary(content);
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
    //   );
    //   return isDifferent;
    //   // return (
    //   //   !shallowequal(nextProps, this.props) ||
    //   //   !shallowequal(nextState, this.state)
    //   // );
    // }

    private getPositionStyle(): BaseStyle {
      const { componentHeight, componentWidth } = this.getComponentDimensions();
      return {
        positionType: PositionTypes.ABSOLUTE,
        componentHeight,
        componentWidth,
        yPosition:
          this.props.topRow * this.props.parentRowSpace +
          CONTAINER_GRID_PADDING,
        xPosition:
          this.props.leftColumn * this.props.parentColumnSpace +
          CONTAINER_GRID_PADDING,
        xPositionUnit: CSSUnits.PIXEL,
        yPositionUnit: CSSUnits.PIXEL,
      };
    }

    // // TODO(abhinav): These defaultProps seem unneccessary. Check it out.
    // static defaultProps: Partial<WidgetProps> = {
    //   parentRowSpace: 1,
    //   parentColumnSpace: 1,
    //   topRow: 0,
    //   leftColumn: 0,
    //   isLoading: false,
    //   renderMode: RenderModes.CANVAS,
    // };
  }
  WidgetWrapper.displayName = `WidgetWithAPI(${getDisplayName(Widget)})`;

  (WidgetWrapper as any).whyDidYouRender = {
    logOnDifferentValues: false,
  };
  return connect(mapStateToProps, mapDispatchToProps)(WidgetWrapper);
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
export interface WidgetBuilderProps extends WidgetSkeleton {
  isVisible: boolean;
  renderMode: RenderMode;
}
export interface WidgetBuilder<WidgetBuilderProps> {
  buildWidget(widgetProps: WidgetBuilderProps): JSX.Element;
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

export interface WidgetProps
  extends WidgetDataProps,
    WidgetDynamicPathListProps,
    WidgetEvaluatedProps {
  key?: string;
  isDefaultClickDisabled?: boolean;
  [key: string]: any;
}

export interface WidgetCardProps {
  type: WidgetType;
  key?: string;
  displayName: string;
  icon: string;
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
  children?: Array<WidgetSkeleton>;
};

export type WidgetOperation = typeof WidgetOperations[keyof typeof WidgetOperations];
const mapStateToProps = (
  state: AppState,
  ownProps: { widgetId: string; children?: Array<{ widgetId: string }> },
) => {
  console.log("Connected Widgets Base Widget", { ownProps });
  const widgetName = findKey(state.evaluations.tree, {
    widgetId: ownProps.widgetId,
  });
  if (widgetName)
    return {
      ...(state.evaluations.tree[widgetName] as WidgetProps),
      canvasWidth:
        state.entities.canvasWidgets[MAIN_CONTAINER_WIDGET_ID].rightColumn,
      ...ownProps,
    };
  else
    return {
      parentRowSpace: 1,
      parentColumnSpace: 1,
      topRow: 0,
      leftColumn: 0,
      isLoading: false,
      renderMode: RenderModes.CANVAS,
      type: "SKELETON_WIDGET",
      mainContainer: getWidget(state, MAIN_CONTAINER_WIDGET_ID),
    };
};

const mapDispatchToProps = (dispatch: any, ownProps: { widgetId: string }) => ({
  executeAction: (actionPayload: ExecuteActionPayload): void => {
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
