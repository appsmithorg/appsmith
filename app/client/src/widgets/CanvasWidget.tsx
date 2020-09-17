import React, { CSSProperties } from "react";
import { WidgetProps } from "widgets/NewBaseWidget";
import ContainerWidget, { ContainerWidgetProps } from "widgets/ContainerWidget";
import {
  WidgetTypes,
  GridDefaults,
  CONTAINER_GRID_PADDING,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { getCanvasClassName } from "utils/generators";
import * as Sentry from "@sentry/react";
import { getWidgetDimensions } from "./helpers";
import WidgetFactory from "../utils/WidgetFactory";
import ContainerComponent from "../components/designSystems/appsmith/ContainerComponent";

class CanvasWidget extends React.Component<ContainerWidgetProps, any> {
  constructor(props: any) {
    super(props);
  }
  getWidgetType = () => {
    return WidgetTypes.CANVAS_WIDGET;
  };

  getSnapSpaces = () => {
    const { componentWidth } = getWidgetDimensions(this.props);
    return {
      snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      snapColumnSpace: componentWidth
        ? (componentWidth - (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2) /
          GridDefaults.DEFAULT_GRID_COLUMNS
        : 0,
    };
  };

  getCanvasProps(): ContainerWidgetProps {
    return {
      ...this.props,
      parentRowSpace: 1,
      parentColumnSpace: 1,
      topRow: 0,
      leftColumn: 0,
      containerStyle: "none",
      isVisible: true,
    };
  }

  renderAsDropTarget() {
    return (
      <DropTargetComponent
        {...this.getCanvasProps()}
        {...this.getSnapSpaces()}
        minHeight={this.props.minHeight || 380}
      >
        {this.renderAsContainerComponent(this.props)}
      </DropTargetComponent>
    );
  }

  renderChildren = () => {
    return this.props.children?.map(WidgetFactory.createWidget);
    // return _.map(
    //   // sort by row so stacking context is correct
    //   // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
    //   // Figure out a way in which the stacking context is consistent.
    //   // _.sortBy(_.compact(this.props.children), child => child.topRow),
    //   this.renderChildWidget,
    // );
  };

  renderAsContainerComponent(props: ContainerWidgetProps) {
    return (
      <ContainerComponent {...props}>
        {this.renderChildren()}
      </ContainerComponent>
    );
  }

  render() {
    // return this.renderAsDropTarget();

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

export default CanvasWidget;
export const ProfiledCanvasWidget = Sentry.withProfiler(CanvasWidget);
