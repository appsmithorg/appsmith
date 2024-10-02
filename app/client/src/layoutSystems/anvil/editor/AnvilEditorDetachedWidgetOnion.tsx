import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { useObserveDetachedWidget } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import {
  useAddBordersToDetachedWidgets,
  useHandleDetachedWidgetSelect,
} from "layoutSystems/anvil/common/hooks/detachedWidgetHooks";
import { AnvilErrorBoundary } from "../common/widgetComponent/AnvilErrorBoundary";
import { SKELETON_WIDGET_TYPE } from "constants/WidgetConstants";
import { useAnvilDetachedWidgetsDnD } from "./hooks/useAnvilDetachedWidgetsDnD";

/**
 * AnvilEditorDetachedWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Detached Widget with Editor specific wrappers
 * needed in Anvil.
 *
 * Editor specific wrappers are wrappers added to perform actions in the editor.
 * - AnvilWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */
export const AnvilEditorDetachedWidgetOnion = (props: BaseWidgetProps) => {
  useObserveDetachedWidget(props.widgetId);
  useHandleDetachedWidgetSelect(props.widgetId);
  useAddBordersToDetachedWidgets(props.widgetId, props.type);
  useAnvilDetachedWidgetsDnD(
    props.widgetId,
    props.layout[0].layoutId,
    !!props.isVisible,
  );

  return props.type !== SKELETON_WIDGET_TYPE ? (
    <AnvilErrorBoundary {...props}>{props.children}</AnvilErrorBoundary>
  ) : null;
};
