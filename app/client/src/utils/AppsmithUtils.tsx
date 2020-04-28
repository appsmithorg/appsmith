import { ReduxAction } from "constants/ReduxActionConstants";
import { getAppsmithConfigs } from "configs";
import * as Sentry from "@sentry/browser";
import AnalyticsUtil from "./AnalyticsUtil";
import FontFaceObserver from "fontfaceobserver";

import FormControlRegistry from "./FormControlRegistry";
import { Property } from "api/ActionAPI";
import _ from "lodash";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import * as log from "loglevel";
import { LogLevelDesc } from "loglevel";

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
  FormControlRegistry.registerFormControlBuilders();
  const appsmithConfigs = getAppsmithConfigs();
  if (appsmithConfigs.sentry.enabled && appsmithConfigs.sentry.config) {
    Sentry.init(appsmithConfigs.sentry.config);
  }
  if (appsmithConfigs.hotjar.enabled && appsmithConfigs.hotjar.config) {
    const { id, sv } = appsmithConfigs.hotjar.config;
    AnalyticsUtil.initializeHotjar(id, sv);
  }
  if (appsmithConfigs.segment.enabled) {
    AnalyticsUtil.initializeSegment(appsmithConfigs.segment.key);
  }
  log.setLevel(getEnvLogLevel(appsmithConfigs.logLevel));

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

export const mapToPropList = (map: Record<string, string>): Property[] => {
  return _.map(map, (value, key) => {
    return { key: key, value: value };
  });
};

export const getNextEntityName = (prefix: string, existingNames: string[]) => {
  const regex = new RegExp(`^${prefix}(\\d+)$`);
  const usedIndices: number[] = existingNames.map(name => {
    if (name && regex.test(name)) {
      const matches = name.match(regex);
      const ind =
        matches && Array.isArray(matches) ? parseInt(matches[1], 10) : 0;
      return Number.isNaN(ind) ? 0 : ind;
    }
    return 0;
  }) as number[];

  const lastIndex = Math.max(...usedIndices, ...[0]);

  return prefix + (lastIndex + 1);
};

export const getDuplicateName = (prefix: string, existingNames: string[]) => {
  const trimmedPrefix = prefix.replace(/ /g, "");
  const regex = new RegExp(`^${trimmedPrefix}(\\d+)$`);
  const usedIndices: number[] = existingNames.map(name => {
    if (name && regex.test(name)) {
      const matches = name.match(regex);
      const ind =
        matches && Array.isArray(matches) ? parseInt(matches[1], 10) : 0;
      return Number.isNaN(ind) ? 0 : ind;
    }
    return 0;
  }) as number[];

  const lastIndex = Math.max(...usedIndices, ...[0]);

  return trimmedPrefix + `_${lastIndex + 1}`;
};

export const createNewApiName = (actions: ActionDataState, pageId: string) => {
  const pageApiNames = actions
    .filter(a => a.config.pageId === pageId)
    .map(a => a.config.name);
  return getNextEntityName("Api", pageApiNames);
};

export const noop = () => {
  console.log("noop");
};

export const convertToString = (value: any): string => {
  if (_.isUndefined(value)) {
    return "";
  }
  if (_.isObject(value)) {
    return JSON.stringify(value, null, 2);
  }
  if (_.isString(value)) return value;
  return value.toString();
};

const getEnvLogLevel = (configLevel: LogLevelDesc): LogLevelDesc => {
  let logLevel = configLevel;
  const localStorageLevel = localStorage.getItem("logLevel") as LogLevelDesc;
  if (localStorageLevel) logLevel = localStorageLevel;
  return logLevel;
};
