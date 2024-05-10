import React, { useMemo } from "react";
import type { AnvilFlexComponentProps } from "../utils/types";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { usePositionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import { useAnvilWidgetStyles } from "./hooks/useAnvilWidgetStyles";
import { useAnvilWidgetClick } from "./hooks/useAnvilWidgetClick";
import { useAnvilWidgetDrag } from "./hooks/useAnvilWidgetDrag";
import { useAnvilWidgetHover } from "./hooks/useAnvilWidgetHover";
import styles from "./styles.module.css";

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
      } row-index-${props.rowIndex} 
      ${styles.disableAnvilWidgetInteraction}`,
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
  useAnvilWidgetStyles(
    props.widgetId,
    props.widgetName,
    props.isVisible,
    props.widgetType,
    ref,
  );
  useAnvilWidgetDrag(props.widgetId, props.widgetType, props.layoutId, ref);
  useAnvilWidgetHover(props.widgetId, ref);
  // Note: For some reason native click callback listeners are somehow hindering with events required for toggle-able widgets like checkbox, switch, etc.
  // Hence supplying click and click capture callbacks to the AnvilFlexComponent
  const { onClickCaptureFn, onClickFn } = useAnvilWidgetClick(
    props.widgetId,
    ref,
  );

  // Render the AnvilFlexComponent
  return (
    <AnvilFlexComponent
      {...props}
      className={className}
      onClick={onClickFn}
      onClickCapture={onClickCaptureFn}
      ref={ref}
    />
  );
};
