import React, { useMemo } from "react";
import type { AnvilFlexComponentProps } from "../utils/types";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { usePositionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import { useAnvilFlexStyles } from "./hooks/useAnvilFlexStyles";
import { useAnvilFlexClick } from "./hooks/useAnvilFlexClick";
import { useAnvilFlexDrag } from "./hooks/useAnvilFlexDrag";
import { useAnvilFlexHover } from "./hooks/useAnvilFlexHover";
import { useAnvilFlexZIndex } from "./hooks/useAnvilFlexZIndex";

export const AnvilEditorFlexComponent = (props: AnvilFlexComponentProps) => {
  // Create a ref for the AnvilFlexComponent
  const ref = React.useRef<HTMLDivElement>(null);

  // Generate a className for the AnvilFlexComponent
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

  // observe the layout element's position
  usePositionObserver(
    "widget",
    { widgetId: props.widgetId, layoutId: props.layoutId },
    ref,
  );

  // Use custom hooks to manage styles, click, drag, and hover behavior exclusive for Edit mode
  useAnvilFlexStyles(props.widgetId, props.widgetName, props.isVisible, ref);
  useAnvilFlexClick(props.widgetId, ref);
  useAnvilFlexDrag(props.widgetId, props.layoutId, ref);
  useAnvilFlexHover(props.widgetId, ref);

  // Calculate z-index based on widget type
  const onHoverZIndex = useAnvilFlexZIndex(props.widgetId, props.widgetType);

  // Render the AnvilFlexComponent
  return (
    <AnvilFlexComponent
      {...props}
      className={className}
      onHoverZIndex={onHoverZIndex}
      ref={ref}
    />
  );
};
