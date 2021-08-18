import React, { ReactNode } from "react";

import { connect } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import WidgetFactory from "utils/WidgetFactory";
import ModalComponent from "../component";
import {
  RenderMode,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";

import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickOpenPropPane";

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
            ],
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
  };

  getModalWidth() {
    const widthFromOverlay = this.props.mainContainer.rightColumn * 0.95;
    const defaultModalWidth = MODAL_SIZE[this.props.size].width;
    return widthFromOverlay < defaultModalWidth
      ? widthFromOverlay
      : defaultModalWidth;
  }

  renderChildWidget = (childWidgetData: WidgetProps): ReactNode => {
    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? Math.max(childWidgetData.bottomRow, MODAL_SIZE[this.props.size].height)
      : MODAL_SIZE[this.props.size].height;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.containerStyle = "none";
    childWidgetData.minHeight = MODAL_SIZE[this.props.size].height;
    childWidgetData.rightColumn = this.getModalWidth();
    return WidgetFactory.createWidget(childWidgetData);
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

  closeModal = (e: any) => {
    this.props.showPropertyPane(undefined);
    this.onModalClose();
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

  makeModalComponent(content: ReactNode) {
    return (
      <ModalComponent
        canEscapeKeyClose={!!this.props.canEscapeKeyClose}
        canOutsideClickClose={!!this.props.canOutsideClickClose}
        className={`t--modal-widget ${generateClassName(this.props.widgetId)}`}
        height={MODAL_SIZE[this.props.size].height}
        isOpen={!!this.props.isVisible}
        onClose={this.closeModal}
        scrollContents={!!this.props.shouldScrollContents}
        width={this.getModalWidth()}
      >
        {content}
      </ModalComponent>
    );
  }

  getCanvasView() {
    let children = this.getChildren();
    children = this.makeModalSelectable(children);
    children = this.showWidgetName(children, true);
    return this.makeModalComponent(children);
  }

  getPageView() {
    const children = this.getChildren();
    return this.makeModalComponent(children);
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
  width?: number;
  height?: number;
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
  };
  return props;
};
export default ModalWidget;
export const ProfiledModalWidget = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ModalWidget);
