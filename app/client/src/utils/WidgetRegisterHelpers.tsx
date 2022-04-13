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
import { memoize } from "lodash";
import { withWidgetProps } from "widgets/withWidgetProps";

export interface WidgetConfiguration {
  type: string;
  name: string;
  iconSVG?: string;
  defaults: Partial<WidgetProps> & WidgetConfigProps;
  hideCard?: boolean;
  isCanvas?: boolean;
  needsMeta?: boolean;
  properties: {
    config: PropertyPaneConfig[];
    default: Record<string, string>;
    meta: Record<string, any>;
    derived: DerivedPropertiesMap;
  };
}

const generateWidget = memoize(function getWidgetComponent(
  Widget: typeof BaseWidget,
  needsMeta: boolean,
) {
  const MetaWidget = needsMeta ? withMeta(Widget) : Widget;
  const ConfiguredWidget = withWidgetProps(MetaWidget as typeof BaseWidget);

  return Sentry.withProfiler(ConfiguredWidget);
});

export const registerWidget = (Widget: any, config: WidgetConfiguration) => {
  const ProfiledWidget = generateWidget(Widget, !!config.needsMeta);

  WidgetFactory.registerWidgetBuilder(
    config.type,
    {
      buildWidget(widgetData: any): JSX.Element {
        return <ProfiledWidget {...widgetData} key={widgetData.widgetId} />;
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
    isCanvas: config.isCanvas,
  };

  store.dispatch({
    type: ReduxActionTypes.ADD_WIDGET_CONFIG,
    payload: _config,
  });

  WidgetFactory.storeWidgetConfig(config.type, _config);
};
