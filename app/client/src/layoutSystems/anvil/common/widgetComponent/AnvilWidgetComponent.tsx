import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import Skeleton from "widgets/Skeleton";
import { AnvilErrorBoundary } from "./AnvilErrorBoundary";

export const AnvilWidgetComponent = (props: BaseWidgetProps) => {
  const { children, deferRender, type } = props;

  /**
   * The widget mount calls the withWidgetProps with the widgetId and type to fetch the
   * widget props. During the computation of the props (in withWidgetProps) if the evaluated
   * values are not present (which will not be during mount), the widget type is changed to
   * SKELETON_WIDGET.
   *
   * Note:- This is done to retain the old rendering flow without any breaking changes.
   * This could be refactored into not changing the widget type but to have a boolean flag.
   */
  if (type === "SKELETON_WIDGET" || deferRender) {
    return <Skeleton />;
  }

  return <AnvilErrorBoundary>{children}</AnvilErrorBoundary>;
};
