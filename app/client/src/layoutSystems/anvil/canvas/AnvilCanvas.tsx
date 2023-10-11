import React from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutComponentProps } from "../utils/anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { getCanvasId } from "./utils";
import { RenderModes } from "constants/WidgetConstants";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const map: LayoutComponentProps["childrenMap"] = {};
  props.children.forEach((child: WidgetProps) => {
    map[child.widgetId] = child;
  });
  const style = {
    minHeight: props.minHeight + "px",
  };
  return (
    <div
      className="anvil-canvas"
      id={getCanvasId(props.widgetId)}
      style={style}
    >
      {renderLayouts(
        props.layout,
        map,
        props.widgetId,
        props.renderMode || RenderModes.CANVAS,
      )}
    </div>
  );
};
