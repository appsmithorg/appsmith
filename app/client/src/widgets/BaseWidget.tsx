/**
 * Widget are responsible for accepting the abstraction layer inputs, interpretting them into rederable props and
 * spawing components based on those props
 * Widgets are also responsible for dispatching actions and updating the state tree
 */
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { BatchPropertyUpdatePayload } from "actions/controlActions";
import AutoHeightContainerWrapper from "components/autoHeight/AutoHeightContainerWrapper";
import AutoHeightOverlayContainer from "components/autoHeightOverlay";
import {
  FlexVerticalAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import FlexComponent from "components/designSystems/appsmith/autoLayout/FlexComponent";
import PositionedContainer from "components/designSystems/appsmith/PositionedContainer";
import DraggableComponent from "components/editorComponents/DraggableComponent";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import ResizableComponent from "components/editorComponents/ResizableComponent";
import SnipeableComponent from "components/editorComponents/SnipeableComponent";
import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import {
  CSSUnit,
  GridDefaults,
  PositionType,
  RenderMode,
  RenderModes,
  WidgetType,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Stylesheet } from "entities/AppTheming";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { get, memoize } from "lodash";
import React, { Component, ReactNode } from "react";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import shallowequal from "shallowequal";
import { CSSProperties } from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  DataTreeEvaluationProps,
  EvaluationError,
  EVAL_ERROR_PATH,
  WidgetDynamicPathListProps,
} from "utils/DynamicBindingUtils";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { CanvasWidgetStructure } from "./constants";
import Skeleton from "./Skeleton";
import {
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
  isAutoHeightEnabledForWidget,
  shouldUpdateWidgetHeightAutomatically,
} from "./WidgetUtils";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

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
  context!: React.ContextType<typeof EditorContext>;

  static getPropertyPaneConfig(): PropertyPaneConfig[] {
    return [];
  }

  static getPropertyPaneContentConfig(): PropertyPaneConfig[] {
    return [];
  }

  static getPropertyPaneStyleConfig(): PropertyPaneConfig[] {
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

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  /**
   * getLoadingProperties returns a list of regexp's used to specify bindingPaths,
   * which can set the isLoading prop of the widget.
   * When:
   * 1. the path is bound to an action (API/Query)
   * 2. the action is currently in-progress
   *
   * if undefined, all paths can set the isLoading state
   * if empty array, no paths can set the isLoading state
   */
  static getLoadingProperties(): Array<RegExp> | undefined {
    return;
  }

  /**
   *  Widget abstraction to register the widget type
   *  ```javascript
   *   getWidgetType() {
   *     return "MY_AWESOME_WIDGET",
   *   }
   *  ```
   */

  /**
   *  Widgets can execute actions using this `executeAction` method.
   *  Triggers may be specific to the widget
   */
  executeAction(actionPayload: ExecuteTriggerPayload): void {
    const { executeAction } = this.context;
    executeAction &&
      executeAction({
        ...actionPayload,
        source: {
          id: this.props.widgetId,
          name: this.props.widgetName,
        },
      });

    actionPayload.triggerPropertyName &&
      AppsmithConsole.info({
        text: `${actionPayload.triggerPropertyName} triggered`,
        source: {
          type: ENTITY_TYPE.WIDGET,
          id: this.props.widgetId,
          name: this.props.widgetName,
        },
      });
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

  deleteWidgetProperty(propertyPaths: string[]): void {
    const { deleteWidgetProperty } = this.context;
    const { widgetId } = this.props;
    if (deleteWidgetProperty && widgetId) {
      deleteWidgetProperty(widgetId, propertyPaths);
    }
  }

  batchUpdateWidgetProperty(
    updates: BatchPropertyUpdatePayload,
    shouldReplay = true,
  ): void {
    const { batchUpdateWidgetProperty } = this.context;
    const { widgetId } = this.props;
    if (batchUpdateWidgetProperty && widgetId) {
      batchUpdateWidgetProperty(widgetId, updates, shouldReplay);
    }
  }

  updateWidgetProperty(propertyName: string, propertyValue: any): void {
    this.batchUpdateWidgetProperty({
      modify: { [propertyName]: propertyValue },
    });
  }

  resetChildrenMetaProperty(widgetId: string) {
    const { resetChildrenMetaProperty } = this.context;
    if (resetChildrenMetaProperty) resetChildrenMetaProperty(widgetId);
  }

  /*
    This method calls the action to update widget height
    We're not using `updateWidgetProperty`, because, the workflow differs
    We will be computing properties of all widgets which are effected by
    this change.
    @param height number: Height of the widget's contents in pixels
    @return void

    TODO (abhinav): Make sure that this isn't called for scenarios which do not require it
    This is for performance. We don't want unnecessary code to run
  */
  updateAutoHeight = (height: number): void => {
    const paddedHeight =
      Math.ceil(
        Math.ceil(height + WIDGET_PADDING * 2) /
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      ) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    const shouldUpdate = shouldUpdateWidgetHeightAutomatically(
      paddedHeight,
      this.props,
    );
    const { updateWidgetAutoHeight } = this.context;

    if (updateWidgetAutoHeight) {
      const { widgetId } = this.props;
      shouldUpdate && updateWidgetAutoHeight(widgetId, paddedHeight);
    }
  };

  selectWidgetRequest = (
    selectionRequestType: SelectionRequestType,
    payload?: string[],
  ) => {
    const { selectWidgetRequest } = this.context;
    if (selectWidgetRequest) {
      selectWidgetRequest(selectionRequestType, payload);
    }
  };

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
      this.props.mobileLeftColumn,
      this.props.mobileRightColumn,
      this.props.mobileTopRow,
      this.props.mobileBottomRow,
      this.props.isMobile,
      this.props.isFlexChild,
    );
  };

  calculateWidgetBounds(
    rightColumn: number,
    leftColumn: number,
    topRow: number,
    bottomRow: number,
    parentColumnSpace: number,
    parentRowSpace: number,
    mobileLeftColumn?: number,
    mobileRightColumn?: number,
    mobileTopRow?: number,
    mobileBottomRow?: number,
    isMobile?: boolean,
    isFlexChild?: boolean,
  ): {
    componentWidth: number;
    componentHeight: number;
  } {
    let left = leftColumn;
    let right = rightColumn;
    let top = topRow;
    let bottom = bottomRow;
    if (isFlexChild && isMobile) {
      if (mobileLeftColumn !== undefined && parentColumnSpace !== 1) {
        left = mobileLeftColumn;
      }
      if (mobileRightColumn !== undefined && parentColumnSpace !== 1) {
        right = mobileRightColumn;
      }
      if (mobileTopRow !== undefined && parentRowSpace !== 1) {
        top = mobileTopRow;
      }
      if (mobileBottomRow !== undefined && parentRowSpace !== 1) {
        bottom = mobileBottomRow;
      }
    }

    return {
      componentWidth: (right - left) * parentColumnSpace,
      componentHeight: (bottom - top) * parentRowSpace,
    };
  }

  getLabelWidth = () => {
    return (Number(this.props.labelWidth) || 0) * this.props.parentColumnSpace;
  };

  getErrorCount = memoize((evalErrors: Record<string, EvaluationError[]>) => {
    return Object.values(evalErrors).reduce(
      (prev, curr) => curr.length + prev,
      0,
    );
  }, JSON.stringify);

  render() {
    return this.getWidgetView();
  }

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
    return !this.props.disablePropertyPane ? (
      <WidgetNameComponent
        errorCount={this.getErrorCount(get(this.props, EVAL_ERROR_PATH, {}))}
        isFlexChild={!!this.props.isFlexChild}
        parentId={this.props.parentId}
        showControls={showControls}
        topRow={this.props.detachFromLayout ? 4 : this.props.topRow}
        type={this.props.type}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
        widgetProps={this.props}
      >
        {content}
      </WidgetNameComponent>
    ) : (
      { content }
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

  /**
   * wraps the widget in a draggable component.
   * Note: widget drag can be disabled by setting `dragDisabled` prop to true
   *
   * @param content
   */
  makeSnipeable(content: ReactNode) {
    return <SnipeableComponent {...this.props}>{content}</SnipeableComponent>;
  }

  makePositioned(content: ReactNode) {
    const { componentHeight, componentWidth } = this.getComponentDimensions();

    return (
      <PositionedContainer
        componentHeight={componentHeight}
        componentWidth={componentWidth}
        focused={this.props.focused}
        isDisabled={this.props.isDisabled}
        isVisible={this.props.isVisible}
        leftColumn={this.props.leftColumn}
        noContainerOffset={this.props.noContainerOffset}
        parentColumnSpace={this.props.parentColumnSpace}
        parentId={this.props.parentId}
        parentRowSpace={this.props.parentRowSpace}
        resizeDisabled={this.props.resizeDisabled}
        selected={this.props.selected}
        topRow={this.props.topRow}
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

  addAutoHeightOverlay(content: ReactNode, style?: CSSProperties) {
    // required when the limits have to be updated
    // simultaneosuly when they move together
    // to maintain the undo/redo stack
    const onBatchUpdate = ({
      maxHeight,
      minHeight,
    }: {
      maxHeight?: number;
      minHeight?: number;
    }) => {
      const modifyObj: Record<string, unknown> = {};

      if (maxHeight !== undefined) {
        modifyObj["maxDynamicHeight"] = Math.floor(
          maxHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        );
      }

      if (minHeight !== undefined) {
        modifyObj["minDynamicHeight"] = Math.floor(
          minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        );
      }

      this.batchUpdateWidgetProperty({
        modify: modifyObj,
        postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      });
      AnalyticsUtil.logEvent("AUTO_HEIGHT_OVERLAY_HANDLES_UPDATE", modifyObj);
    };

    const onMaxHeightSet = (maxHeight: number) => onBatchUpdate({ maxHeight });

    const onMinHeightSet = (minHeight: number) => onBatchUpdate({ minHeight });

    return (
      <>
        <AutoHeightOverlayContainer
          {...this.props}
          batchUpdate={onBatchUpdate}
          maxDynamicHeight={getWidgetMaxAutoHeight(this.props)}
          minDynamicHeight={getWidgetMinAutoHeight(this.props)}
          onMaxHeightSet={onMaxHeightSet}
          onMinHeightSet={onMinHeightSet}
          style={style}
        />
        {content}
      </>
    );
  }

  makeFlex(content: ReactNode) {
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    return (
      <FlexComponent
        componentHeight={componentHeight}
        componentWidth={componentWidth}
        direction={this.props.direction}
        flexVerticalAlignment={
          this.props.flexVerticalAlignment || FlexVerticalAlignment.Top
        }
        focused={this.props.focused}
        isMobile={this.props.isMobile}
        parentColumnSpace={this.props.parentColumnSpace}
        parentId={this.props.parentId}
        responsiveBehavior={this.props.responsiveBehavior}
        selected={this.props.selected}
        widgetId={this.props.widgetId}
        widgetType={this.props.type}
      >
        {content}
      </FlexComponent>
    );
  }
  getWidgetComponent = () => {
    const { renderMode, type } = this.props;

    /**
     * The widget mount calls the withWidgetProps with the widgetId and type to fetch the
     * widget props. During the computation of the props (in withWidgetProps) if the evaluated
     * values are not present (which will not be during mount), the widget type is changed to
     * SKELETON_WIDGET.
     *
     * Note:- This is done to retain the old rendering flow without any breaking changes.
     * This could be refactored into not changing the widget type but to have a boolean flag.
     */
    if (type === "SKELETON_WIDGET") {
      return <Skeleton />;
    }

    const content =
      renderMode === RenderModes.CANVAS
        ? this.getCanvasView()
        : this.getPageView();

    // This `if` code is responsible for the unmount of the widgets
    // while toggling the dynamicHeight property
    // Adding a check for the Modal Widget early
    // to avoid deselect Modal in its unmount effect.
    if (
      isAutoHeightEnabledForWidget(this.props) &&
      !this.props.isAutoGeneratedWidget && // To skip list widget's auto generated widgets
      !this.props.detachFromLayout // To skip Modal widget issue #18697
    ) {
      return (
        <AutoHeightContainerWrapper
          onUpdateDynamicHeight={(height) => this.updateAutoHeight(height)}
          widgetProps={this.props}
        >
          {content}
        </AutoHeightContainerWrapper>
      );
    }
    return this.addErrorBoundary(content);
  };

  private getWidgetView(): ReactNode {
    let content: ReactNode;

    switch (this.props.renderMode) {
      case RenderModes.CANVAS:
        content = this.getWidgetComponent();
        if (!this.props.detachFromLayout) {
          if (!this.props.resizeDisabled) content = this.makeResizable(content);
          content = this.showWidgetName(content);
          content = this.makeDraggable(content);
          content = this.makeSnipeable(content);
          // NOTE: In sniping mode we are not blocking onClick events from PositionWrapper.
          if (this.props.isFlexChild) {
            content = this.makeFlex(content);
          } else {
            content = this.makePositioned(content);
          }
          if (isAutoHeightEnabledForWidget(this.props, true)) {
            content = this.addAutoHeightOverlay(content);
          }
        }

        return content;

      // return this.getCanvasView();
      case RenderModes.PAGE:
        content = this.getWidgetComponent();
        if (this.props.isVisible) {
          if (this.props.isFlexChild) content = this.makeFlex(content);
          else if (!this.props.detachFromLayout) {
            content = this.makePositioned(content);
          }
          return content;
        }
        return null;
      default:
        throw Error("RenderMode not defined");
    }
  }

  abstract getPageView(): ReactNode;

  getCanvasView(): ReactNode {
    return this.getPageView();
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

  // TODO(abhinav): These defaultProps seem unneccessary. Check it out.
  static defaultProps: Partial<WidgetProps> | undefined = {
    parentRowSpace: 1,
    parentColumnSpace: 1,
    topRow: 0,
    leftColumn: 0,
    isLoading: false,
    renderMode: RenderModes.CANVAS,
    dragDisabled: false,
    dropDisabled: false,
    isDeletable: true,
    resizeDisabled: false,
    disablePropertyPane: false,
    isFlexChild: false,
    isMobile: false,
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

export interface WidgetBuilder<
  T extends CanvasWidgetStructure,
  S extends WidgetState
> {
  buildWidget(widgetProps: T): JSX.Element;
}

export interface WidgetBaseProps {
  widgetId: string;
  type: WidgetType;
  widgetName: string;
  parentId?: string;
  renderMode: RenderMode;
  version: number;
  childWidgets?: DataTreeWidget[];
}

export type WidgetRowCols = {
  leftColumn: number;
  rightColumn: number;
  topRow: number;
  bottomRow: number;
  minHeight?: number; // Required to reduce the size of CanvasWidgets.
  mobileLeftColumn?: number;
  mobileRightColumn?: number;
  mobileTopRow?: number;
  mobileBottomRow?: number;
  height?: number;
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
  isFlexChild?: boolean;
  direction?: LayoutDirection;
  responsiveBehavior?: ResponsiveBehavior;
  minWidth?: number; // Required to avoid squishing of widgets on mobile viewport.
  isMobile?: boolean;
  flexVerticalAlignment?: FlexVerticalAlignment;
  appPositioningType?: AppPositioningTypes;
}

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
  animateLoading?: boolean;
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

export type WidgetOperation = typeof WidgetOperations[keyof typeof WidgetOperations];

export default BaseWidget;
