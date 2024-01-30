import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AnvilEditorDetachedWidgetOnion } from "./AnvilEditorDetachedWidgetOnion";
import { AnvilEditorWidgetOnion } from "./AnvilEditorWidgetOnion";

/**
 * AnvilEditorWrapper
 *
 * Component that wraps a BaseWidget implementation of a widget with editor specific layers of Anvil.
 * check out AnvilEditorWidgetOnion and AnvilEditorDetachedWidgetOnion to further understand what they implement under the hood.
 *
 * @param props | WidgetProps
 * @returns Enhanced BaseWidget with Editor specific Layers.
 */
export const AnvilEditorWrapper = (props: WidgetProps) => {
  //Widget Onion
  const WidgetOnion = useMemo(() => {
    return props.detachFromLayout
      ? AnvilEditorDetachedWidgetOnion
      : AnvilEditorWidgetOnion;
  }, [props.type]);

  return <WidgetOnion {...props}>{props.children}</WidgetOnion>;
};
