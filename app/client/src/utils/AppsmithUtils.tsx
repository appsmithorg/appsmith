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
import { providerBackgroundColors } from "constants/providerConstants";
import FeatureFlag from "utils/featureFlags";

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
  FeatureFlag.initialize(appsmithConfigs.featureFlag);

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
  // setConfigFeatureFlags(appsmithConfigs.featureFlags);

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

export const createNewQueryName = (
  queries: ActionDataState,
  pageId: string,
) => {
  const pageApiNames = queries
    .filter(a => a.config.pageId === pageId)
    .map(a => a.config.name);
  const newName = getNextEntityName("Query", pageApiNames);
  return newName;
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

// const setConfigFeatureFlags = (flags: Array<FeatureFlagEnum>) => {
//   flags.forEach(flag => {
//     localStorage.setItem(flag, "true");
//   });
// };

export const getInitialsAndColorCode = (fullName: any): string[] => {
  let inits = "";
  // if name contains space. eg: "Full Name"
  if (fullName.includes(" ")) {
    const namesArr = fullName.split(" ");
    let initials = namesArr.map((name: string) => name.charAt(0));
    initials = initials.join("").toUpperCase();
    inits = initials.slice(0, 2);
  } else {
    // handle for camelCase
    const str = fullName.replace(/([a-z])([A-Z])/g, "$1 $2");
    const namesArr = str.split(" ");
    let initials = namesArr.map((name: string) => name.charAt(0));
    initials = initials.join("").toUpperCase();
    inits = initials.slice(0, 2);
  }
  const colorCode = getColorCode(inits);
  return [inits, colorCode];
};

const getColorCode = (initials: string): string => {
  let asciiSum = 0;
  for (let i = 0; i < initials.length; i++) {
    asciiSum += initials[i].charCodeAt(0);
  }
  return providerBackgroundColors[asciiSum % providerBackgroundColors.length];
};

export function hexToRgb(
  hex: string,
): {
  r: number;
  g: number;
  b: number;
} {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: -1,
        g: -1,
        b: -1,
      };
}
