import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import withMeta from "widgets/MetaHOC";
import withWidgetProps from "../withWidgetProps";
import { memo } from "react";
import { useLayoutSystem } from "./render/layoutSystems/useLayoutSystem";

export interface BaseWidgetProps extends WidgetProps, WidgetState {}

export const withBaseWidgetHOC = (
  Widget: (widgetData: any) => JSX.Element,
  needsMeta: boolean,
) => {
  function WrappedWidget(props: WidgetProps) {
    const EnhancedWidget = needsMeta ? withMeta(Widget as any) : Widget;
    const withLayoutSystemHOC = useLayoutSystem();
    const BaseWidgetWrappedWidget = withLayoutSystemHOC(EnhancedWidget);
    const HydratedWidget = withWidgetProps(BaseWidgetWrappedWidget as any);
    return <HydratedWidget {...props} />;
  }
  return memo(WrappedWidget);
};
