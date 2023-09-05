import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AnvilViewerModalOnion } from "./AnvilViewerModalOnion";
import { AnvilViewerWidgetOnion } from "./AnvilViewerWidgetOnion";

export const AnvilViewerWrapper = (props: WidgetProps) => {
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? AnvilViewerModalOnion
      : AnvilViewerWidgetOnion;
  }, [props.type]);

  if (props.type === "CANVAS_WIDGET") {
    return props.children;
  }

  return <WidgetOnion {...props}>{props.children}</WidgetOnion>;
};
