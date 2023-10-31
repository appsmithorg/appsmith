import React from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutComponentProps } from "../utils/anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { getAnvilCanvasId } from "./utils";
import { RenderModes } from "constants/WidgetConstants";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const map: LayoutComponentProps["childrenMap"] = {};
  props.children.forEach((child: WidgetProps) => {
    map[child.widgetId] = child;
  });

  const className: string = `anvil-canvas ${props.classList?.join(" ")}`;

  return (
    <div className={className} id={getAnvilCanvasId(props.widgetId)}>
      {renderLayouts(
        props.layout,
        map,
        props.widgetId,
        "",
        props.renderMode || RenderModes.CANVAS,
        [],
      )}
    </div>
  );
};
