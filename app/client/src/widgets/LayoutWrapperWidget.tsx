import React, { CSSProperties } from "react";

import { WidgetProps } from "widgets/BaseWidget";
import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  ContainerWidget,
  ContainerWidgetProps,
} from "./ContainerWidget/widget";
import { DropTargetComponent } from "components/editorComponents/DropTargetComponent";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { getCanvasClassName } from "utils/generators";
import { GridDefaults } from "constants/WidgetConstants";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import {
  LayoutDirection,
  Positioning,
  ResponsiveBehavior,
} from "components/constants";
import { CanvasWidgetStructure } from "./constants";

class LayoutWrapperWidget extends ContainerWidget {
  static getPropertyPaneConfig() {
    return [];
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
  static getWidgetType() {
    return "LAYOUT_WRAPPER_WIDGET";
  }
  componentDidMount(): void {
    super.componentDidMount();
  }
  componentDidUpdate(prevProps: ContainerWidgetProps<any>): void {
    if (this.props.positioning !== prevProps.positioning)
      this.updatePositioningInformation();
  }
  updatePositioningInformation = (): void => {
    this.setState({
      useAutoLayout: true,
      direction:
        this.props.positioning === Positioning.Horizontal
          ? LayoutDirection.Vertical
          : LayoutDirection.Horizontal,
    });
  };

  getCanvasProps(): ContainerWidgetProps<WidgetProps> {
    return {
      ...this.props,
      parentRowSpace: 1,
      parentColumnSpace: 1,
      topRow: 0,
      leftColumn: 0,
      containerStyle: "none",
      detachFromLayout: false,
    };
  }
  renderAsDropTarget() {
    const canvasProps = this.getCanvasProps();
    return (
      <DropTargetComponent
        {...canvasProps}
        {...this.getSnapSpaces()}
        direction={this.state.direction}
        minHeight={this.props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX}
      >
        {this.renderAsContainerComponent(canvasProps)}
      </DropTargetComponent>
    );
  }

  renderChildWidget(childWidgetData: CanvasWidgetStructure): React.ReactNode {
    if (!childWidgetData) return null;

    const childWidget = { ...childWidgetData };

    const snapSpaces = this.getSnapSpaces();
    childWidget.parentColumnSpace = snapSpaces.snapColumnSpace;
    childWidget.parentRowSpace = snapSpaces.snapRowSpace;
    if (this.props.noPad) childWidget.noContainerOffset = true;
    childWidget.parentId = this.props.widgetId;
    // Pass layout controls to children
    childWidget.positioning =
      childWidget?.positioning || this.props.positioning;
    childWidget.useAutoLayout = this.state.useAutoLayout;
    childWidget.direction = this.state.direction;
    childWidget.justifyContent = this.props.justifyContent;
    childWidget.alignItems = this.props.alignItems;

    if (
      childWidget?.responsiveBehavior === ResponsiveBehavior.Fill &&
      this.state.isMobile
    ) {
      childWidget.leftColumn = 0;
      childWidget.rightColumn = 64;
    }

    return WidgetFactory.createWidget(childWidget, this.props.renderMode);
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
    if (!this.props.dropDisabled) {
      return this.renderAsDropTarget();
    }
    return this.getPageView();
  }
}

export const CONFIG = {
  type: LayoutWrapperWidget.getWidgetType(),
  name: "LayoutWrapper",
  hideCard: true,
  defaults: {
    rows: 0,
    columns: 0,
    widgetName: "Canvas",
    version: 1,
    detachFromLayout: true,
    containerStyle: "none",
  },
  properties: {
    derived: LayoutWrapperWidget.getDerivedPropertiesMap(),
    default: LayoutWrapperWidget.getDefaultPropertiesMap(),
    meta: LayoutWrapperWidget.getMetaPropertiesMap(),
    config: LayoutWrapperWidget.getPropertyPaneConfig(),
  },
};

export default LayoutWrapperWidget;
