import React, { useEffect, useState } from "react";
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
import { getCanvasClassName } from "utils/generators";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const [childrenMap, setChildrenMap] = useState<
    LayoutComponentProps["childrenMap"]
  >({});

  useEffect(() => {
    const map: LayoutComponentProps["childrenMap"] = {};
    props.children?.forEach((child: WidgetProps) => {
      map[child.widgetId] = child;
    });
    setChildrenMap(map);
  }, [props.children]);

  const gapClass = props.renderMode === RenderModes.CANVAS ? "gap" : "";
  return (
    <div
      className={`anvil-canvas ${
        props.widgetId === MAIN_CONTAINER_WIDGET_ID
          ? `${getCanvasClassName()} overflowY ${gapClass}`
          : ""
      }`}
      id={getAnvilCanvasId(props.widgetId)}
    >
      {renderLayouts(
        props.layout,
        childrenMap,
        props.widgetId,
        "",
        props.renderMode || RenderModes.CANVAS,
        [],
      )}
    </div>
  );
};
