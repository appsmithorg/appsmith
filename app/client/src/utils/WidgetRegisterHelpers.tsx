import React from "react";

import * as Sentry from "@sentry/react";
import store from "store";

import BaseWidget, { WidgetProps } from "widgets/BaseWidget";
import WidgetFactory from "./WidgetFactory";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import withMeta from "widgets/MetaHOC";
import { generateReactKey } from "./generators";
import { memoize } from "lodash";
import { WidgetFeatureProps } from "./WidgetFeatures";
import { WidgetConfiguration } from "widgets/constants";

const generateWidget = memoize(function getWidgetComponent(
  Widget: typeof BaseWidget,
  needsMeta: boolean,
) {
  const MetaWidget = needsMeta ? withMeta(Widget) : Widget;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Sentry.withProfiler(MetaWidget);
});

export const registerWidget = (Widget: any, config: WidgetConfiguration) => {
  const ProfiledWidget = generateWidget(Widget, !!config.needsMeta);

  WidgetFactory.registerWidgetBuilder(
    config.type,
    {
      buildWidget(widgetData: WidgetProps): JSX.Element {
        return <ProfiledWidget {...widgetData} key={widgetData.widgetId} />;
      },
    },
    config.properties.derived,
    config.properties.default,
    config.properties.meta,
    config.properties.config,
    config.features,
  );
  configureWidget(config);
};

export const configureWidget = (config: WidgetConfiguration) => {
  let features = {};
  if (config.features && config.features.dynamicHeight) {
    features = Object.assign({}, WidgetFeatureProps.DYNAMIC_HEIGHT);
  }
  const _config = {
    ...features,
    ...config.defaults,
    type: config.type,
    hideCard: !!config.hideCard || !config.iconSVG,
    isDeprecated: !!config.isDeprecated,
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
