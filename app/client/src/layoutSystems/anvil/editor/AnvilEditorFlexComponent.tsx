import React, { useMemo } from "react";
import type { AnvilFlexComponentProps } from "../utils/types";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { useAnvilFlexZIndex } from "./hooks/useAnvilFlexZIndex";
import { usePositionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import { useAnvilFlexComponentStylesHook } from "./hooks/useAnvilFlexComponentStylesHook";
import { useAnvilFlexComponentEventsHook } from "./hooks/useAnvilFlexComponentEventsHook";

export const AnvilEditorFlexComponent = (props: AnvilFlexComponentProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const className = useMemo(
    () =>
      `anvil-layout-parent-${props.parentId} anvil-layout-child-${
        props.widgetId
      } ${widgetTypeClassname(
        props.widgetType,
      )} t--widget-${props.widgetName.toLowerCase()} drop-target-${
        props.layoutId
      } row-index-${props.rowIndex} anvil-widget-wrapper`,
    [
      props.parentId,
      props.widgetId,
      props.widgetType,
      props.widgetName,
      props.layoutId,
      props.rowIndex,
    ],
  );
  usePositionObserver(
    "widget",
    { widgetId: props.widgetId, layoutId: props.layoutId },
    ref,
  );
  useAnvilFlexComponentStylesHook(
    props.widgetId,
    props.widgetName,
    props.isVisible,
    ref,
  );
  useAnvilFlexComponentEventsHook(props.widgetId, props.layoutId, ref);
  const onHoverZIndex = useAnvilFlexZIndex(props.widgetId, props.widgetType);
  return (
    <AnvilFlexComponent
      {...props}
      className={className}
      onHoverZIndex={onHoverZIndex}
      ref={ref}
    />
  );
};
