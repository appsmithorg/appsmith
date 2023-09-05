import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AnvilEditorModalOnion } from "./AnvilEditorModalOnion";
import { AnvilEditorWidgetOnion } from "./AnvilEditorWidgetOnion";

export const AnvilEditorWrapper = (props: WidgetProps) => {
  //Widget Onion
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? AnvilEditorModalOnion
      : AnvilEditorWidgetOnion;
  }, [props.type]);

  //Canvas_Onion
  if (props.type === "CANVAS_WIDGET") {
    return props.children;
  }

  return <WidgetOnion {...props}>{props.children}</WidgetOnion>;
};
