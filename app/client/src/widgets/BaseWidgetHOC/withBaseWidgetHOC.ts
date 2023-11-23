import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import withMeta from "widgets/MetaHOC";
import { withLazyRender } from "widgets/withLazyRender";
import type BaseWidget from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import * as Sentry from "@sentry/react";
import { withLayoutSystemWidgetHOC } from "../../layoutSystems/withLayoutSystemWidgetHOC";

export interface BaseWidgetProps extends WidgetProps, WidgetState {}

export const withBaseWidgetHOC = (
  Widget: typeof BaseWidget,
  needsMeta: boolean,
  eagerRender: boolean,
) => {
  // Adds Meta properties and functionality
  const MetaWidget = needsMeta ? withMeta(Widget) : Widget;
  // Adds Lazy rendering layer to a widget
  const LazyRenderedWidget = eagerRender
    ? MetaWidget
    : withLazyRender(MetaWidget as any);
  // Adds respective layout specific layers to a widget
  const LayoutWrappedWidget = withLayoutSystemWidgetHOC(LazyRenderedWidget);
  // Adds/Enhances widget props
  const HydratedWidget = withWidgetProps(LayoutWrappedWidget as any);
  // Wraps the widget to be profiled via sentry
  return Sentry.withProfiler(HydratedWidget);
};
