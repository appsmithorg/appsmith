import React, { ReactNode } from "react";

import { connect } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import ModalComponent from "components/designSystems/blueprint/ModalComponent";
import {
  WidgetTypes,
  RenderMode,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";

const MODAL_SIZE: { [id: string]: { width: number; height: number } } = {
  MODAL_SMALL: {
    width: 456,
    height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 6,
  },
  MODAL_LARGE: {
    width: 532,
    height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 15,
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
      ? childWidgetData.bottomRow
      : MODAL_SIZE[this.props.size].height;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.containerStyle = "none";
    childWidgetData.minHeight = MODAL_SIZE[this.props.size].height;
    childWidgetData.rightColumn = this.getModalWidth();
    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
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

  makeModalComponent(content: ReactNode) {
    return (
      <React.Fragment>
        <ModalComponent
          isOpen={!!this.props.isVisible}
          onClose={this.closeModal}
          width={this.getModalWidth()}
          height={MODAL_SIZE[this.props.size].height}
          className={`t--modal-widget ${generateClassName(
            this.props.widgetId,
          )}`}
          canOutsideClickClose={!!this.props.canOutsideClickClose}
          canEscapeKeyClose={!!this.props.canEscapeKeyClose}
          scrollContents={!!this.props.shouldScrollContents}
        >
          {content}
        </ModalComponent>
      </React.Fragment>
    );
  }

  getCanvasView() {
    let children = this.getChildren();
    children = this.showWidgetName(children, true);
    return this.makeModalComponent(children);
  }

  getPageView() {
    const children = this.getChildren();
    return this.makeModalComponent(children);
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
  width?: number;
  height?: number;
  showPropertyPane: (widgetId?: string) => void;
  canEscapeKeyClose?: boolean;
  shouldScrollContents?: boolean;
  size: string;
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
)(Sentry.withProfiler(withMeta(ModalWidget)));
