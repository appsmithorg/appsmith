import React from "react";

import * as Sentry from "@sentry/react";
import store from "store";

import { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { WidgetPropertyValidationType } from "./WidgetValidation";
import WidgetFactory, { DerivedPropertiesMap } from "./WidgetFactory";

import { ReduxActionTypes } from "constants/ReduxActionConstants";
import withMeta from "widgets/MetaHOC";
export interface WidgetConfiguration {
  type: string;
  name: string;
  iconSVG: string;
  defaults: Partial<WidgetProps> & WidgetConfigProps;
  properties: {
    config: PropertyPaneConfig[];
    validations: WidgetPropertyValidationType;
    default: Record<string, string>;
    meta: Record<string, any>;
    derived: DerivedPropertiesMap;
  };
}

export const registerWidget = (Widget: any, config: WidgetConfiguration) => {
  WidgetFactory.registerWidgetBuilder(
    config.type,
    {
      buildWidget(widgetData: any): JSX.Element {
        const ProfiledWidget = Sentry.withProfiler(withMeta(Widget));
        return <ProfiledWidget {...widgetData} />;
      },
    },
    config.properties.validations,
    config.properties.derived,
    config.properties.default,
    config.properties.meta,
    config.properties.config,
  );
  configureWidget(config);
};

export const configureWidget = (config: WidgetConfiguration) => {
  const _config = { ...config.defaults, type: config.type };
  store.dispatch({
    type: ReduxActionTypes.ADD_WIDGET_CONFIG,
    payload: _config,
  });

  WidgetFactory.storeWidgetConfig(config.type, _config);
};
