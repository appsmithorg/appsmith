import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import { useObserveDetachedWidget } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";
import {
  useAddBordersToDetachedWidgets,
  useHandleDetachedWidgetSelect,
} from "layoutSystems/anvil/common/hooks/detachedWidgetHooks";

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
export const AnvilEditorDetachedWidgetOnion = (
  props: BaseWidgetProps,
): JSX.Element => {
  useObserveDetachedWidget(props.widgetId);
  useHandleDetachedWidgetSelect(props.widgetId);
  useAddBordersToDetachedWidgets(props.widgetId);

  return (
    <AnvilWidgetComponent {...props}>{props.children}</AnvilWidgetComponent>
  );
};
