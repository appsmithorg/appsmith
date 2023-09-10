import React from "react";
import withMeta from "widgets/MetaHOC";
import { withLazyRender } from "widgets/withLazyRender";
import withWidgetProps from "widgets/withWidgetProps";
import { flow, identity } from "lodash";
import * as Sentry from "@sentry/react";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import type BaseWidget from "widgets/BaseWidget";
import WidgetFactory from ".";

/*
 * Function to create builder for the widgets and register them in widget factory
 * Note: Ideally we should do this on the widfactory itself. but introducing the withMeta
 * HOC in the widget factory file leads to the circular dependency hence we have
 * extracted this into a seperate file to break the circular reference.
 *
 */
export const registerWidgets = (widgets: (typeof BaseWidget)[]) => {
  const widgetAndBuilders = widgets.map((widget) => {
    const { eagerRender, needsMeta } = widget.getConfig();

    const ProfiledWidget = flow([
      needsMeta ? withMeta : identity,
      withWidgetProps,
      eagerRender ? identity : withLazyRender,
      Sentry.withProfiler,
    ])(widget);

    return [
      widget,
      (widgetProps: CanvasWidgetStructure) => (
        <ProfiledWidget {...widgetProps} key={widgetProps.widgetId} />
      ),
    ] as [
      typeof BaseWidget,
      (widgetProps: CanvasWidgetStructure) => React.ReactNode,
    ];
  });

  WidgetFactory.initialize(widgetAndBuilders);
};
