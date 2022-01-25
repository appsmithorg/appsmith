import {
  CurrentApplicationData,
  Page,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import * as Sentry from "@sentry/react";
import AnalyticsUtil from "./AnalyticsUtil";
import FormControlRegistry from "./FormControlRegistry";
import { Property } from "api/ActionAPI";
import _ from "lodash";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import * as log from "loglevel";
import { LogLevelDesc } from "loglevel";
import produce from "immer";
import { AppIconCollection, AppIconName } from "components/ads/AppIcon";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import { createMessage, ERROR_500 } from "@appsmith/constants/messages";
import localStorage from "utils/localStorage";
import { APP_MODE } from "entities/App";
import { trimQueryString } from "./helpers";
import {
  getApplicationEditorPageURL,
  getApplicationViewerPageURL,
} from "constants/routes";

export const createReducer = (
  initialState: any,
  handlers: { [type: string]: (state: any, action: any) => any },
) => {
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } else {
      return state;
    }
  };
};

export const createImmerReducer = (
  initialState: any,
  handlers: { [type: string]: any },
) => {
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      return produce(handlers[action.type])(state, action);
    } else {
      return state;
    }
  };
};

export const appInitializer = () => {
  FormControlRegistry.registerFormControlBuilders();
  const appsmithConfigs = getAppsmithConfigs();
  log.setLevel(getEnvLogLevel(appsmithConfigs.logLevel));
};

export const initializeAnalyticsAndTrackers = () => {
  const appsmithConfigs = getAppsmithConfigs();

  try {
    if (appsmithConfigs.sentry.enabled && !window.Sentry) {
      window.Sentry = Sentry;
      Sentry.init({
        ...appsmithConfigs.sentry,
        beforeBreadcrumb(breadcrumb) {
          if (
            breadcrumb.category === "console" &&
            breadcrumb.level !== "error"
          ) {
            return null;
          }
          if (breadcrumb.category === "sentry.transaction") {
            return null;
          }
          if (breadcrumb.category === "redux.action") {
            if (
              breadcrumb.data &&
              breadcrumb.data.type === "SET_EVALUATED_TREE"
            ) {
              breadcrumb.data = undefined;
            }
          }
          return breadcrumb;
        },
      });
    }
  } catch (e) {
    log.error(e);
  }

  try {
    if (appsmithConfigs.smartLook.enabled && !(window as any).smartlook) {
      const { id } = appsmithConfigs.smartLook;
      AnalyticsUtil.initializeSmartLook(id);
    }

    if (appsmithConfigs.segment.enabled && !(window as any).analytics) {
      if (appsmithConfigs.segment.apiKey) {
        // This value is only enabled for Appsmith's cloud hosted version. It is not set in self-hosted environments
        AnalyticsUtil.initializeSegment(appsmithConfigs.segment.apiKey);
      } else if (appsmithConfigs.segment.ceKey) {
        // This value is set in self-hosted environments. But if the analytics are disabled, it's never used.
        AnalyticsUtil.initializeSegment(appsmithConfigs.segment.ceKey);
      }
    }
  } catch (e) {
    Sentry.captureException(e);
    log.error(e);
  }
};

export const mapToPropList = (map: Record<string, string>): Property[] => {
  return _.map(map, (value, key) => {
    return { key: key, value: value };
  });
};

export const getNextEntityName = (
  prefix: string,
  existingNames: string[],
  startWithoutIndex?: boolean,
) => {
  const regex = new RegExp(`^${prefix}(\\d+)$`);

  const usedIndices: number[] = existingNames.map((name) => {
    if (name && regex.test(name)) {
      const matches = name.match(regex);
      const ind =
        matches && Array.isArray(matches) ? parseInt(matches[1], 10) : 0;
      return Number.isNaN(ind) ? 0 : ind;
    }
    return 0;
  }) as number[];

  const lastIndex = Math.max(...usedIndices, ...[0]);

  if (startWithoutIndex && lastIndex === 0) {
    const exactMatchFound = existingNames.some(
      (name) => prefix && name.trim() === prefix.trim(),
    );
    if (!exactMatchFound) {
      return prefix.trim();
    }
  }

  return prefix + (lastIndex + 1);
};

export const getDuplicateName = (prefix: string, existingNames: string[]) => {
  const trimmedPrefix = prefix.replace(/ /g, "");
  const regex = new RegExp(`^${trimmedPrefix}(\\d+)$`);
  const usedIndices: number[] = existingNames.map((name) => {
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
    .filter((a) => a.config.pageId === pageId)
    .map((a) => a.config.name);
  return getNextEntityName("Api", pageApiNames);
};

export const createNewJSFunctionName = (
  jsActions: ActionDataState,
  pageId: string,
) => {
  const pageJsFunctionNames = jsActions
    .filter((a) => a.config.pageId === pageId)
    .map((a) => a.config.name);
  return getNextEntityName("JSObject", pageJsFunctionNames);
};

export const noop = () => {
  log.debug("noop");
};

export const stopEventPropagation = (e: any) => {
  e.stopPropagation();
};

export const createNewQueryName = (
  queries: ActionDataState,
  pageId: string,
) => {
  const pageApiNames = queries
    .filter((a) => a.config.pageId === pageId)
    .map((a) => a.config.name);
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
  if (localStorage && localStorage.getItem) {
    const localStorageLevel = localStorage.getItem(
      "logLevelOverride",
    ) as LogLevelDesc;
    if (localStorageLevel) logLevel = localStorageLevel;
  }
  return logLevel;
};

export const getInitialsAndColorCode = (
  fullName: any,
  colorPalette: string[],
): string[] => {
  let inits = "";
  // if name contains space. eg: "Full Name"
  if (fullName && fullName.includes(" ")) {
    const namesArr = fullName.split(" ");
    let initials = namesArr.map((name: string) => name.charAt(0));
    initials = initials.join("").toUpperCase();
    inits = initials.slice(0, 2);
  } else {
    // handle for camelCase
    const str = fullName ? fullName.replace(/([a-z])([A-Z])/g, "$1 $2") : "";
    const namesArr = str.split(" ");
    let initials = namesArr.map((name: string) => name.charAt(0));
    initials = initials.join("").toUpperCase();
    inits = initials.slice(0, 2);
  }
  const colorCode = getColorCode(inits, colorPalette);
  return [inits, colorCode];
};

export const getColorCode = (
  initials: string,
  colorPalette: string[],
): string => {
  let asciiSum = 0;
  for (let i = 0; i < initials.length; i++) {
    asciiSum += initials[i].charCodeAt(0);
  }
  return colorPalette[asciiSum % colorPalette.length];
};

export const getApplicationIcon = (initials: string): AppIconName => {
  let asciiSum = 0;
  for (let i = 0; i < initials.length; i++) {
    asciiSum += initials[i].charCodeAt(0);
  }
  return AppIconCollection[asciiSum % AppIconCollection.length];
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

export function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const keys = urlParams.keys();
  let key = keys.next().value;
  const queryParams: Record<string, string> = {};
  while (key) {
    queryParams[key] = urlParams.get(key) as string;
    key = keys.next().value;
  }
  return queryParams;
}

export function convertObjectToQueryParams(object: any): string {
  if (!_.isNil(object)) {
    const paramArray: string[] = _.map(_.keys(object), (key) => {
      return encodeURIComponent(key) + "=" + encodeURIComponent(object[key]);
    });
    return "?" + _.join(paramArray, "&");
  } else {
    return "";
  }
}

export const retryPromise = (
  fn: () => Promise<any>,
  retriesLeft = 5,
  interval = 1000,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch(() => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            return Promise.reject({
              code: ERROR_CODES.SERVER_ERROR,
              message: createMessage(ERROR_500),
              show: false,
            });
          }

          // Passing on "reject" is the important part
          retryPromise(fn, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });
};

export const getRandomPaletteColor = (colorPalette: string[]) => {
  return colorPalette[Math.floor(Math.random() * colorPalette.length)];
};

export const isBlobUrl = (url: string) => {
  return typeof url === "string" && url.startsWith("blob:");
};

/**
 *
 * @param data string file data
 * @param type string file type
 * @returns string containing blob id and type
 */
export const createBlobUrl = (data: Blob | string, type: string) => {
  let url = URL.createObjectURL(data);
  url = url.replace(
    `${window.location.protocol}//${window.location.hostname}/`,
    "",
  );

  return `${url}?type=${type}`;
};

/**
 *
 * @param blobId string blob id along with type.
 * @returns [string,string] [blobUrl, type]
 */
export const parseBlobUrl = (blobId: string) => {
  const url = `blob:${window.location.protocol}//${
    window.location.hostname
  }/${blobId.substring(5)}`;
  return url.split("?type=");
};

/**
 * Convert a string into camelCase
 * @param sourceString input string
 * @returns camelCase string
 */
export const getCamelCaseString = (sourceString: string) => {
  let out = "";
  // Split the input string to separate words using RegEx
  const regEx = /[A-Z\xC0-\xD6\xD8-\xDE]?[a-z\xDF-\xF6\xF8-\xFF]+|[A-Z\xC0-\xD6\xD8-\xDE]+(?![a-z\xDF-\xF6\xF8-\xFF])|\d+/g;
  const words = sourceString.match(regEx);
  if (words) {
    words.forEach(function(el, idx) {
      const add = el.toLowerCase();
      out += idx === 0 ? add : add[0].toUpperCase() + add.slice(1);
    });
  }

  return out;
};

/*
 * gets the page url
 *
 * Note: for edit mode, the page will have different url ( contains '/edit' at the end )
 *
 * @param page
 * @returns
 */
export const getPageURL = (
  page: Page,
  appMode: APP_MODE | undefined,
  currentApplicationDetails: CurrentApplicationData | undefined,
) => {
  if (appMode === APP_MODE.PUBLISHED) {
    return trimQueryString(
      getApplicationViewerPageURL({
        applicationId: currentApplicationDetails?.id,
        pageId: page.pageId,
      }),
    );
  }

  return getApplicationEditorPageURL(
    currentApplicationDetails?.id,
    page.pageId,
  );
};

/**
 * Convert Base64 string to Blob
 * @param base64Data
 * @param contentType
 * @param sliceSize
 * @returns
 */
export const base64ToBlob = (
  base64Data: string,
  contentType = "",
  sliceSize = 512,
) => {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};
