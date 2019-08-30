import { ReduxAction } from "../constants/ActionConstants"
import { SENTRY_PROD_CONFIG, SENTRY_STAGE_CONFIG, HOTJAR_PROD_HJID, HOTJAR_PROD_HJSV } from "../constants/ThirdPartyConstants";
import * as Sentry from '@sentry/browser';
import HotjarUtil from "./HotjarUtil"

export const createReducer = (
  initialState: any,
  handlers: { [type: string]: Function }
) => {
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action)
    } else {
      return state
    }
  }
}

export const appInitializer = () => {
  switch (process.env.REACT_APP_ENVIRONMENT) {
    case "PRODUCTION":
      Sentry.init(SENTRY_PROD_CONFIG);    
      HotjarUtil.initializeHotjar(HOTJAR_PROD_HJID, HOTJAR_PROD_HJSV);
      break;
    case "STAGING":
        Sentry.init(SENTRY_STAGE_CONFIG);
      break
    case "LOCAL":
        HotjarUtil.initializeHotjar(HOTJAR_PROD_HJID, HOTJAR_PROD_HJSV);
      break;
  }
}


