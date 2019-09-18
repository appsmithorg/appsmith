import { ReduxAction } from "../constants/ReduxActionConstants";
import {
  SENTRY_PROD_CONFIG,
  SENTRY_STAGE_CONFIG,
  HOTJAR_PROD_HJID,
  HOTJAR_PROD_HJSV,
} from "../constants/ThirdPartyConstants";
import * as Sentry from "@sentry/browser";
import AnalyticsUtil from "./AnalyticsUtil";
import netlifyIdentity from "netlify-identity-widget";
import FontFaceObserver from "fontfaceobserver";
import PropertyControlRegistry from "./PropertyControlRegistry";
import WidgetBuilderRegistry from "./WidgetRegistry";

export const createReducer = (
  initialState: any,
  handlers: { [type: string]: Function },
) => {
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } else {
      return state;
    }
  };
};

export const appInitializer = () => {
  WidgetBuilderRegistry.registerWidgetBuilders();
  PropertyControlRegistry.registerPropertyControlBuilders();
  netlifyIdentity.init();
  switch (process.env.REACT_APP_ENVIRONMENT) {
    case "PRODUCTION":
      Sentry.init(SENTRY_PROD_CONFIG);
      AnalyticsUtil.initializeHotjar(HOTJAR_PROD_HJID, HOTJAR_PROD_HJSV);
      AnalyticsUtil.initializeSegment();
      break;
    case "STAGING":
      Sentry.init(SENTRY_STAGE_CONFIG);
      break;
    case "LOCAL":
      break;
  }

  const textFont = new FontFaceObserver("DM Sans");
  textFont
    .load()
    .then(() => {
      document.body.className += "fontLoaded";
    })
    .catch(err => {
      console.log(err);
    });
};
