import React from "react";

import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilErrorBoundary } from "../common/widgetComponent/AnvilErrorBoundary";
import { SKELETON_WIDGET_TYPE } from "constants/WidgetConstants";

/**
 * AnvilViewerDetachedWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Detached Widget with Viewer(Deployed Application Viewer) specific wrappers
 * needed in Anvil.
 *
 * Viewer specific wrappers are wrappers added to perform actions in the viewer.
 * - AnvilWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */
export const AnvilViewerDetachedWidgetOnion = (props: BaseWidgetProps) => {
  return props.type !== SKELETON_WIDGET_TYPE ? (
    <AnvilErrorBoundary {...props}>{props.children}</AnvilErrorBoundary>
  ) : null;
};
