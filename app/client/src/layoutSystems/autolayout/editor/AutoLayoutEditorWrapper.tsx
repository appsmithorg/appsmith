import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutEditorWidgetOnion } from "./AutoLayoutEditorWidgetOnion";
import { AutoLayoutEditorModalOnion } from "./AutoLayoutEditorModalOnion";

/**
 * AutoLayoutEditorWrapper
 *
 * Component that wraps a BaseWidget implementation of a widget with editor specific layers of Auto Layout System.
 * check out AutoLayoutEditorWidgetOnion and AutoLayoutEditorModalOnion to further understand what they implement under the hood.
 *
 * @param props
 * @returns Enhanced BaseWidget with Editor specific Layers.
 */

export const AutoLayoutEditorWrapper = (props: WidgetProps) => {
  /**
   * @constant WidgetOnion
   *
   * Widget Onion here refers to the Layers surrounding a widget just like layers in an onion.
   */
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? AutoLayoutEditorModalOnion
      : AutoLayoutEditorWidgetOnion;
  }, [props.type]);

  return <WidgetOnion {...props}>{props.children}</WidgetOnion>;
};
