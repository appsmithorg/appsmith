import React, { CSSProperties } from "react";
import { WidgetProps } from "widgets/BaseWidget";
import ContainerWidget, { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetTypes, GridDefaults } from "constants/WidgetConstants";
import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { getCanvasClassName } from "utils/generators";
import * as Sentry from "@sentry/react";
import WidgetFactory from "utils/WidgetFactory";

class CanvasWidget extends ContainerWidget {
  static getPropertyPaneConfig() {
    return [];
  }
  getWidgetType = () => {
    return WidgetTypes.CANVAS_WIDGET;
  };

  getCanvasProps(): ContainerWidgetProps<WidgetProps> {
    return {
      ...this.props,
      parentRowSpace: 1,
      parentColumnSpace: 1,
      topRow: 0,
      leftColumn: 0,
      containerStyle: "none",
    };
  }

  renderAsDropTarget() {
    const canvasProps = this.getCanvasProps();
    return (
      <DropTargetComponent
        {...canvasProps}
        {...this.getSnapSpaces()}
        minHeight={this.props.minHeight || 380}
      >
        {this.renderAsContainerComponent(canvasProps)}
      </DropTargetComponent>
    );
  }

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    if (!childWidgetData) return null;
    // For now, isVisible prop defines whether to render a detached widget
    if (childWidgetData.detachFromLayout && !childWidgetData.isVisible) {
      return null;
    }
    const snapSpaces = this.getSnapSpaces();

    childWidgetData.parentColumnSpace = snapSpaces.snapColumnSpace;
    childWidgetData.parentRowSpace = snapSpaces.snapRowSpace;
    if (this.props.noPad) childWidgetData.noContainerOffset = true;
    childWidgetData.parentId = this.props.widgetId;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  }

  getPageView() {
    let height = 0;
    const snapRows = getCanvasSnapRows(
      this.props.bottomRow,
      this.props.canExtend,
    );
    height = snapRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    const style: CSSProperties = {
      width: "100%",
      height: `${height}px`,
      background: "none",
      position: "relative",
    };
    // This div is the DropTargetComponent alternative for the page view
    // DropTargetComponent and this div are responsible for the canvas height
    return (
      <div className={getCanvasClassName()} style={style}>
        {this.renderAsContainerComponent(this.getCanvasProps())}
      </div>
    );
  }

  getCanvasView() {
    if (this.props.dropDisabled) return this.getPageView();
    return this.renderAsDropTarget();
  }
}

export default CanvasWidget;
export const ProfiledCanvasWidget = Sentry.withProfiler(CanvasWidget);
