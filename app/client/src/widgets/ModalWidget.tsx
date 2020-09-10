import React, { ReactNode } from "react";

import { connect } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import BaseWidget, { WidgetProps, WidgetState } from "./NewBaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import ModalComponent from "components/designSystems/blueprint/ModalComponent";
import {
  WidgetTypes,
  RenderMode,
  GridDefaults,
} from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import * as Sentry from "@sentry/react";

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

class ModalWidget extends React.Component<ModalWidgetProps, WidgetState> {
  static defaultProps = {
    isOpen: true,
    canEscapeKeyClose: false,
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
      return children.length > 0 && children.map(WidgetFactory.createWidget);
    }
  }

  makeModalComponent(content: ReactNode) {
    return (
      <React.Fragment>
        <ModalComponent
          isOpen={!!this.props.isVisible}
          onClose={this.closeModal}
          width={MODAL_SIZE[this.props.size].width}
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
    const children = this.getChildren();
    // children = this.showWidgetName(children, true);
    return this.makeModalComponent(children);
  }

  render() {
    const children = this.getChildren();
    return this.makeModalComponent(children);
  }

  getWidgetType() {
    return WidgetTypes.MODAL_WIDGET;
  }
}

export interface ModalWidgetProps extends WidgetProps {
  renderMode: RenderMode;
  isOpen?: boolean;
  children?: string[];
  canOutsideClickClose?: boolean;
  width?: number;
  height?: number;
  showPropertyPane: Function;
  canEscapeKeyClose?: boolean;
  shouldScrollContents?: boolean;
  size: string;
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
export default ModalWidget;
export const ProfiledModalWidget = connect(
  null,
  mapDispatchToProps,
)(Sentry.withProfiler(ModalWidget));
