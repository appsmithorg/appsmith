import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutViewerModalOnion } from "./AutoLayoutViewerModalOnion";
import { AutoLayoutViewerWidgetOnion } from "./AutoLayoutViewerWidgetOnion";

/**
 * AutoLayoutViewerWrapper
 *
 * Component that wraps a BaseWidget implementation of a widget with viewer(Deployed Application Viewer) specific layers of Auto Layout System.
 * check out AutoLayoutViewerWidgetOnion and AutoLayoutViewerModalOnion to further understand what they implement under the hood.
 *
 * @param props
 * @returns Enhanced BaseWidget with Viewer specific Layers.
 */

export const AutoLayoutViewerWrapper = (props: WidgetProps) => {
  /**
   * @constant WidgetOnion
   *
   * Widget Onion here refers to the Layers surrounding a widget just like layers in an onion.
   */
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? AutoLayoutViewerModalOnion
      : AutoLayoutViewerWidgetOnion;
  }, [props.type]);

  return <WidgetOnion {...props}>{props.children}</WidgetOnion>;
};
