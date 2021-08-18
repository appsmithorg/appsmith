import React from "react";

import * as Sentry from "@sentry/react";
import store from "store";

import BaseWidget, { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import WidgetFactory, { DerivedPropertiesMap } from "./WidgetFactory";

import { ReduxActionTypes } from "constants/ReduxActionConstants";
import withMeta from "widgets/MetaHOC";
import { generateReactKey } from "./generators";
export interface WidgetConfiguration {
  type: string;
  name: string;
  iconSVG?: string;
  defaults: Partial<WidgetProps> & WidgetConfigProps;
  hideCard?: boolean;
  needsMeta?: boolean;
  properties: {
    config: PropertyPaneConfig[];
    default: Record<string, string>;
    meta: Record<string, any>;
    derived: DerivedPropertiesMap;
  };
}

export const registerWidget = (
  Widget: typeof BaseWidget,
  config: WidgetConfiguration,
) => {
  WidgetFactory.registerWidgetBuilder(
    config.type,
    {
      buildWidget(widgetData: any): JSX.Element {
        const widget = config.needsMeta ? withMeta(Widget) : Widget;
        const ProfiledWidget = Sentry.withProfiler(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          widget,
        );
        return <ProfiledWidget key={widgetData.widgetId} {...widgetData} />;
      },
    },
    config.properties.derived,
    config.properties.default,
    config.properties.meta,
    config.properties.config,
  );
  configureWidget(config);
};

export const configureWidget = (config: WidgetConfiguration) => {
  const _config = {
    ...config.defaults,
    type: config.type,
    hideCard: !!config.hideCard || !config.iconSVG,
    displayName: config.name,
    key: generateReactKey(),
    iconSVG: config.iconSVG,
  };

  store.dispatch({
    type: ReduxActionTypes.ADD_WIDGET_CONFIG,
    payload: _config,
  });

  WidgetFactory.storeWidgetConfig(config.type, _config);
};
