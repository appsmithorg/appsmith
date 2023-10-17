import React from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutComponentProps } from "../utils/anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { getAnvilCanvasId } from "./utils";
import {
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
} from "constants/WidgetConstants";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const map: LayoutComponentProps["childrenMap"] = {};
  props.children.forEach((child: WidgetProps) => {
    map[child.widgetId] = child;
  });
  return (
    <div
      className={`anvil-canvas ${
        props.widgetId === MAIN_CONTAINER_WIDGET_ID ? "overflowY" : ""
      }`}
      id={getAnvilCanvasId(props.widgetId)}
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
