import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  RenderModes,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import React from "react";
import type { CSSProperties } from "react";
import { getCanvasClassName } from "utils/generators";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import { renderChildren } from "../../../common/canvasOnionUtils";

export const FixedLayoutViewCanvas = (props: BaseWidgetProps) => {
  const snapColumnSpace = props.componentWidth
    ? (props.componentWidth - (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2) /
      GridDefaults.DEFAULT_GRID_COLUMNS
    : 0;
  const style: CSSProperties = {
    width: "100%",
    // height: this.props.isListWidgetCanvas ? "auto" : `${height}px`,
    height: "auto",
    background: "none",
    position: "relative",
  };
  return (
    <div className={getCanvasClassName()} style={style}>
      <ContainerComponent {...props}>
        {renderChildren(
          props.children,
          props.shouldScrollContents,
          props.widgetId,
          RenderModes.PAGE,
          {
            componentHeight: props.componentHeight,
            componentWidth: props.componentWidth,
          },
          {
            parentColumnSpace: snapColumnSpace,
            parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          },
        )}
      </ContainerComponent>
    </div>
  );
};

export const FixedLayoutViewerCanvasOnion = (props: BaseWidgetProps) => {
  return (
    <WidgetComponent {...props}>
      <FixedLayoutViewCanvas {...props} />
    </WidgetComponent>
  );
};
