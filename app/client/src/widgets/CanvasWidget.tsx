import React, { CSSProperties } from "react";
import { WidgetProps } from "widgets/BaseWidget";
import ContainerWidget, { ContainerWidgetProps } from "widgets/ContainerWidget";
import { GridDefaults } from "constants/WidgetConstants";
import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { getCanvasClassName } from "utils/generators";
import * as Sentry from "@sentry/react";
import WidgetFactory from "utils/WidgetFactory";

class CanvasWidget extends ContainerWidget {
  static getPropertyPaneConfig() {
    return [];
  }
  static getWidgetType() {
    return "CANVAS_WIDGET";
  }

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

  getPageView() {
    const snapRows = getCanvasSnapRows(
      this.props.bottomRow,
      this.props.canExtend,
    );
    const height = snapRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
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
    return this.renderAsDropTarget();
  }
}

export const registerWidget = () => {
  WidgetFactory.registerWidgetBuilder(
    CanvasWidget.getWidgetType(),
    {
      buildWidget(widgetData: any): JSX.Element {
        return <ProfiledCanvasWidget {...widgetData} />;
      },
    },
    CanvasWidget.getPropertyValidationMap(),
    CanvasWidget.getDerivedPropertiesMap(),
    CanvasWidget.getDefaultPropertiesMap(),
    CanvasWidget.getMetaPropertiesMap(),
    CanvasWidget.getPropertyPaneConfig(),
  );
};

export default CanvasWidget;
export const ProfiledCanvasWidget = Sentry.withProfiler(CanvasWidget);
