import React, { useEffect, useState } from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutComponentProps } from "../utils/anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { getCanvasId } from "./utils";
import { RenderModes } from "constants/WidgetConstants";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const [childrenMap, setChildrenMap] = useState<
    LayoutComponentProps["childrenMap"]
  >({});

  useEffect(() => {
    if (props.children && props.children?.length) {
      const map: LayoutComponentProps["childrenMap"] = {};
      props.children.forEach((child: WidgetProps) => {
        map[child.widgetId] = child;
      });
      setChildrenMap(map);
    }
  }, [props.children]);

  return (
    <div className="anvil-canvas" id={getCanvasId(props.widgetId)}>
      {renderLayouts(
        props.layout,
        childrenMap,
        props.widgetId,
        props.renderMode || RenderModes.CANVAS,
      )}
    </div>
  );
};
