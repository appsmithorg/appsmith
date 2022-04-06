import React, { ReactNode } from "react";

import { connect } from "react-redux";

import { UIElementSize } from "components/editorComponents/ResizableUtils";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import ModalComponent from "../component";
import {
  RenderMode,
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";
import { commentModeSelector } from "selectors/commentsSelectors";
import { snipingModeSelector } from "selectors/editorSelectors";
import { deselectAllInitAction } from "actions/widgetSelectionActions";
import { ValidationTypes } from "constants/WidgetValidation";

const minSize = 100;

export class ModalWidget extends BaseWidget<ModalWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Enables scrolling for content inside the widget",
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "canOutsideClickClose",
            label: "Quick Dismiss",
            helpText: "Allows dismissing the modal when user taps outside",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "Triggers an action when the modal is closed",
            propertyName: "onClose",
            label: "onClose",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }
  static defaultProps = {
    isOpen: true,
    canEscapeKeyClose: false,
  };

  getMaxModalWidth() {
    return this.props.mainContainer.rightColumn * 0.95;
  }

  getModalWidth(width: number) {
    return Math.min(this.getMaxModalWidth(), width);
  }

  renderChildWidget = (childWidgetData: WidgetProps): ReactNode => {
    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? Math.max(childWidgetData.bottomRow, this.props.height)
      : this.props.height;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.containerStyle = "none";
    childWidgetData.minHeight = this.props.height;
    childWidgetData.rightColumn =
      this.getModalWidth(this.props.width) + WIDGET_PADDING * 2;
    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  onModalClose = () => {
    if (this.props.onClose) {
      super.executeAction({
        triggerPropertyName: "onClose",
        dynamicString: this.props.onClose,
        event: {
          type: EventType.ON_MODAL_CLOSE,
        },
      });
    }
    this.props.deselectAllWidgets();
  };

  onModalResize = (dimensions: UIElementSize) => {
    const newDimensions = {
      height: Math.max(minSize, dimensions.height),
      width: Math.max(minSize, this.getModalWidth(dimensions.width)),
    };

    const canvasWidgetId =
      this.props.children && this.props.children.length > 0
        ? this.props.children[0]?.widgetId
        : "";
    this.updateWidget("MODAL_RESIZE", this.props.widgetId, {
      ...newDimensions,
      canvasWidgetId,
    });
  };

  closeModal = (e: any) => {
    this.props.showPropertyPane(undefined);
    // TODO(abhinav): Create a static property with is a map of widget properties
    // Populate the map on widget load
    this.props.updateWidgetMetaProperty("isVisible", false);
    e.stopPropagation();
    e.preventDefault();
  };

  getChildren(): ReactNode {
    if (
      this.props.height &&
      this.props.width &&
      this.props.children &&
      this.props.children.length > 0
    ) {
      const children = this.props.children.filter(Boolean);
      return children.length > 0 && children.map(this.renderChildWidget);
    }
  }

  makeModalSelectable(content: ReactNode): ReactNode {
    // substitute coz the widget lacks draggable and position containers.
    return (
      <ClickContentToOpenPropPane widgetId={this.props.widgetId}>
        {content}
      </ClickContentToOpenPropPane>
    );
  }

  makeModalComponent(content: ReactNode, isEditMode: boolean) {
    const artBoard = document.getElementById("art-board");
    const portalContainer = isEditMode && artBoard ? artBoard : undefined;
    const {
      focusedWidget,
      isCommentMode,
      isDragging,
      isSnipingMode,
      selectedWidget,
      selectedWidgets,
      widgetId,
    } = this.props;

    const isWidgetFocused =
      focusedWidget === widgetId ||
      selectedWidget === widgetId ||
      selectedWidgets.includes(widgetId);

    const isResizeEnabled =
      !isDragging &&
      isWidgetFocused &&
      isEditMode &&
      !isCommentMode &&
      !isSnipingMode;

    return (
      <ModalComponent
        canEscapeKeyClose={!!this.props.canEscapeKeyClose}
        canOutsideClickClose={!!this.props.canOutsideClickClose}
        className={`t--modal-widget ${generateClassName(this.props.widgetId)}`}
        enableResize={isResizeEnabled}
        height={this.props.height}
        isEditMode={isEditMode}
        isOpen={!!this.props.isVisible}
        maxWidth={this.getMaxModalWidth()}
        minSize={minSize}
        onClose={this.closeModal}
        onModalClose={this.onModalClose}
        portalContainer={portalContainer}
        resizeModal={this.onModalResize}
        scrollContents={!!this.props.shouldScrollContents}
        widgetName={this.props.widgetName}
        width={this.getModalWidth(this.props.width)}
      >
        {content}
      </ModalComponent>
    );
  }

  getCanvasView() {
    let children = this.getChildren();
    children = this.makeModalSelectable(children);
    children = this.showWidgetName(children, true);
    return this.makeModalComponent(children, true);
  }

  getPageView() {
    const children = this.getChildren();
    return this.makeModalComponent(children, false);
  }

  static getWidgetType() {
    return "MODAL_WIDGET";
  }
}

export interface ModalWidgetProps extends WidgetProps {
  renderMode: RenderMode;
  isOpen?: boolean;
  children?: WidgetProps[];
  canOutsideClickClose?: boolean;
  width: number;
  height: number;
  showPropertyPane: (widgetId?: string) => void;
  deselectAllWidgets: () => void;
  canEscapeKeyClose?: boolean;
  shouldScrollContents?: boolean;
  size: string;
  onClose: string;
  mainContainer: WidgetProps;
}

const mapDispatchToProps = (dispatch: any) => ({
  // TODO(abhinav): This is also available in dragResizeHooks
  // DRY this. Maybe leverage, CanvasWidget by making it a CanvasComponent?
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
  deselectAllWidgets: () => {
    dispatch(deselectAllInitAction());
  },
});

const mapStateToProps = (state: AppState) => {
  const props = {
    mainContainer: getWidget(state, MAIN_CONTAINER_WIDGET_ID),
    isCommentMode: commentModeSelector(state),
    isSnipingMode: snipingModeSelector(state),
    selectedWidget: state.ui.widgetDragResize.lastSelectedWidget,
    selectedWidgets: state.ui.widgetDragResize.selectedWidgets,
    focusedWidget: state.ui.widgetDragResize.focusedWidget,
    isDragging: state.ui.widgetDragResize.isDragging,
    isResizing: state.ui.widgetDragResize.isResizing,
  };
  return props;
};

export default connect(mapStateToProps, mapDispatchToProps)(ModalWidget);
