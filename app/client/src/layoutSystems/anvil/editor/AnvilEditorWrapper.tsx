import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AnvilEditorModalOnion } from "./AnvilEditorModalOnion";
import { AnvilEditorWidgetOnion } from "./AnvilEditorWidgetOnion";

/**
 * AnvilEditorWrapper
 *
 * Component that wraps a BaseWidget implementation of a widget with editor specific layers of Anvil.
 * check out AnvilEditorWidgetOnion and AnvilEditorModalOnion to further understand what they implement under the hood.
 *
 * @param props | WidgetProps
 * @returns Enhanced BaseWidget with Editor specific Layers.
 */
export const AnvilEditorWrapper = (props: WidgetProps) => {
  //Widget Onion
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? AnvilEditorModalOnion
      : AnvilEditorWidgetOnion;
  }, [props.type]);

  return <WidgetOnion {...props}>{props.children}</WidgetOnion>;
};
