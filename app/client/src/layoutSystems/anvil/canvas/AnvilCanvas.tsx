import React, { useCallback, useMemo } from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutComponentProps } from "../utils/anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { getAnvilCanvasId } from "./utils";
import { RenderModes } from "constants/WidgetConstants";
import { useClickToClearSelections } from "./useClickToClearSelections";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const map: LayoutComponentProps["childrenMap"] = useMemo(() => {
    const tempMap: LayoutComponentProps["childrenMap"] = {};
    props.children.forEach((child: WidgetProps) => {
      tempMap[child.widgetId] = child;
    });
    return tempMap;
  }, [props.children]);

  const clickToClearSelections = useClickToClearSelections(props.widgetId);
  const className: string = useMemo(
    () => `anvil-canvas ${props.classList?.join(" ")}`,
    [props.classList],
  );

  const handleOnClickCapture = useCallback(
    (event) => {
      clickToClearSelections(event);
    },
    [clickToClearSelections],
  );
  return (
    <div
      className={className}
      id={getAnvilCanvasId(props.widgetId)}
      onClick={clickToClearSelections}
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
