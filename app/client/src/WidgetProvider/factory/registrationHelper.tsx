import React from "react";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import type BaseWidget from "widgets/BaseWidget";
import WidgetFactory from ".";
import { withBaseWidgetHOC } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

/*
 * Function to create builder for the widgets and register them in widget factory
 * Note: Ideally we should do this on the widfactory itself. but introducing the withMeta
 * HOC in the widget factory file leads to the circular dependency hence we have
 * extracted this into a seperate file to break the circular reference.
 *
 */
export const registerWidgets = (widgets: (typeof BaseWidget)[]) => {
  const widgetAndBuilders = widgets.map((widget) => {
    const { eagerRender = false, needsMeta = false } = widget.getConfig();

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ProfiledWidget: any = withBaseWidgetHOC(
      widget,
      needsMeta,
      eagerRender,
    );

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
