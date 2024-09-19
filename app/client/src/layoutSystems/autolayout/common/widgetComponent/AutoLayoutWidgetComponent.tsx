import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import WidgetComponentBoundary from "layoutSystems/common/widgetComponent/WidgetComponentBoundary";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import Skeleton from "widgets/Skeleton";
import { AutoDimensionObserverLayer } from "../autoDimensionObserver/AutoDimensionObserverLayer";

export const AutoLayoutWidgetComponent = (props: BaseWidgetProps) => {
  const { deferRender, detachFromLayout, type } = props;

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

  if (!detachFromLayout) {
    return (
      <AutoDimensionObserverLayer {...props}>
        {props.children}
      </AutoDimensionObserverLayer>
    );
  }

  return (
    <ErrorBoundary>
      <WidgetComponentBoundary widgetType={type}>
        {props.children}
      </WidgetComponentBoundary>
    </ErrorBoundary>
  );
};
