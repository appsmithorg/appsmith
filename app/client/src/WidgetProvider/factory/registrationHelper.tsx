import React from "react";
import widgets from "widgets";
import withMeta from "widgets/MetaHOC";
import { withLazyRender } from "widgets/withLazyRender";
import withWidgetProps from "widgets/withWidgetProps";
import { flow, identity } from "lodash";
import * as Sentry from "@sentry/react";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import type BaseWidget from "widgets/BaseWidget";
import WidgetFactory from ".";

export const registerWidgets = () => {
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
    ] as [typeof BaseWidget, any];
  });

  WidgetFactory.initialize(widgetAndBuilders);
};
