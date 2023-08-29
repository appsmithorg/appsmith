import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import withMeta from "widgets/MetaHOC";
import { withLazyRender } from "widgets/withLazyRender";
import type BaseWidget from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import * as Sentry from "@sentry/react";
import { withLayoutSystemHOC } from "../../layoutSystems/withLayoutSystemHOC";

export interface BaseWidgetProps extends WidgetProps, WidgetState {}

export const withBaseWidgetHOC = (
  Widget: typeof BaseWidget,
  needsMeta: boolean,
  eagerRender: boolean,
) => {
  const MetaWidget = needsMeta ? withMeta(Widget) : Widget;
  const LazyRenderedWidget = eagerRender
    ? MetaWidget
    : withLazyRender(MetaWidget as any);
  const LayoutWrappedWidget = withLayoutSystemHOC(LazyRenderedWidget);
  const HydratedWidget = withWidgetProps(LayoutWrappedWidget as any);
  return Sentry.withProfiler(HydratedWidget);
};
