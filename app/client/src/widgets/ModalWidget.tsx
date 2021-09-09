import React, { ReactNode } from "react";

import { connect } from "react-redux";
import * as Sentry from "@sentry/react";

import ModalComponent from "components/designSystems/blueprint/ModalComponent";
import { UIElementSize } from "components/editorComponents/ResizableUtils";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  WidgetTypes,
  RenderMode,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import WidgetFactory from "utils/WidgetFactory";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";
import { commentModeSelector } from "selectors/commentsSelectors";
import { snipingModeSelector } from "selectors/editorSelectors";
import withMeta, { WithMeta } from "./MetaHOC";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";

const MODAL_SIZE: { [id: string]: { width: number; height: number } } = {
  MODAL_SMALL: {
    width: 456,
    // adjust if DEFAULT_GRID_ROW_HEIGHT changes
    height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 24,
  },
  MODAL_LARGE: {
    width: 532,
    // adjust if DEFAULT_GRID_ROW_HEIGHT changes
    height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 60,
  },
};

export class ModalWidget extends BaseWidget<ModalWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "canOutsideClickClose",
            label: "Quick Dismiss",
            helpText: "Allows dismissing the modal when user taps outside",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "size",
            label: "Modal Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Form Modal",
                value: "MODAL_LARGE",
              },
              {
                label: "Alert Modal",
                value: "MODAL_SMALL",
              },
              {
                label: "Custom Modal",
                value: "MODAL_CUSTOM",
              },
            ],
            updateHook: (
              _: any,
              propertyPath: string,
              propertyValue: string,
            ) => {
              if (MODAL_SIZE[propertyValue]) {
                const { height, width } = MODAL_SIZE[propertyValue];
                return [
                  {
                    propertyPath: "height",
                    propertyValue: height,
                  },
                  {
                    propertyPath: "width",
                    propertyValue: width,
                  },
                  {
                    propertyPath: "isCustomResize",
                    propertyValue: false,
                  },
                  {
                    propertyPath,
                    propertyValue,
                  },
                ];
              } else {
                return [
                  {
                    propertyPath: "isCustomResize",
                    propertyValue: true,
                  },
                  {
                    propertyPath,
                    propertyValue,
                  },
                ];
              }
            },
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Actions",
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
    isCustomResize: false,
  };

  componentDidMount() {
    if (!this.props.height && !this.props.width && this.props.size) {
      const dimensions = MODAL_SIZE[this.props.size];
      this.onModalResize(dimensions);
    }
  }

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
    childWidgetData.rightColumn = this.getModalWidth(this.props.width);
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
  };

  onModalResize = (dimensions: UIElementSize) => {
    const newDimensions = {
      height: dimensions.height,
      width: this.getModalWidth(dimensions.width),
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
    if (this.props.children && this.props.children.length > 0) {
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
      isCustomResize,
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
      isCustomResize &&
      !isCommentMode &&
      !isSnipingMode;

    return (
      <ModalComponent
        canEscapeKeyClose={!!this.props.canEscapeKeyClose}
        canOutsideClickClose={!!this.props.canOutsideClickClose}
        className={`t--modal-widget ${generateClassName(this.props.widgetId)}`}
        enableResize={isResizeEnabled}
        hasBackDrop
        height={this.props.height}
        isEditMode={isEditMode}
        isOpen={!!this.props.isVisible}
        maxWidth={this.getMaxModalWidth()}
        onClose={this.closeModal}
        onModalClose={this.onModalClose}
        portalContainer={portalContainer}
        resizable
        resizeModal={this.onModalResize}
        scrollContents={!!this.props.shouldScrollContents}
        usePortal={false}
        width={this.props.width}
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

  getWidgetType() {
    return WidgetTypes.MODAL_WIDGET;
  }
}

export interface ModalWidgetProps extends WidgetProps, WithMeta {
  renderMode: RenderMode;
  isOpen?: boolean;
  children?: WidgetProps[];
  canOutsideClickClose?: boolean;
  width: number;
  height: number;
  isCustomResize: boolean;
  showPropertyPane: (widgetId?: string) => void;
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
export default ModalWidget;
export const ProfiledModalWidget = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Sentry.withProfiler(withMeta(ModalWidget)));
