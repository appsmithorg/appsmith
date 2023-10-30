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
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const map: LayoutComponentProps["childrenMap"] = {};
  props.children.forEach((child: WidgetProps) => {
    map[child.widgetId] = child;
  });
  const { deselectAll, focusWidget } = useWidgetSelection();
  const showPropertyPane = useShowPropertyPane();

  const className: string = `anvil-canvas ${props.classList?.join(" ")}`;
  const deselectWidgets = (e: React.MouseEvent<HTMLElement>) => {
    if (props.widgetId === MAIN_CONTAINER_WIDGET_ID) {
      deselectAll();
      focusWidget && focusWidget(props.widgetId);
      showPropertyPane && showPropertyPane();
    }
    e.preventDefault();
  };
  return (
    <div
      className={className}
      id={getAnvilCanvasId(props.widgetId)}
      onClick={deselectWidgets}
    >
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
