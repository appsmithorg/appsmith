import { getAppsmithConfigs } from "ee/configs";
import { ERROR_CODES } from "ee/constants/ApiConstants";
import { createMessage, ERROR_500 } from "ee/constants/messages";
import * as Sentry from "@sentry/react";
import type { Property } from "api/ActionAPI";
import type { AppIconName } from "@appsmith/ads-old";
import { AppIconCollection } from "@appsmith/ads-old";
import _, { isPlainObject } from "lodash";
import * as log from "loglevel";
import { osName } from "react-device-detect";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { CreateNewActionKeyInterface } from "ee/entities/Engine/actionHelpers";
import { CreateNewActionKey } from "ee/entities/Engine/actionHelpers";
import { ANONYMOUS_USERNAME } from "../constants/userConstants";
import type { User } from "constants/userConstants";

export const initializeAnalyticsAndTrackers = async (currentUser: User) => {
  const appsmithConfigs = getAppsmithConfigs();

  try {
    if (appsmithConfigs.sentry.enabled && !window.Sentry) {
      window.Sentry = Sentry;
      Sentry.init({
        ...appsmithConfigs.sentry,
        beforeSend(event) {
          const exception = extractSentryException(event);

          if (exception?.type === "ChunkLoadError") {
            // Only log ChunkLoadErrors after the 2 retires
            if (!exception.value?.includes("failed after 2 retries")) {
              return null;
            }
          }

          // Handle Non-Error rejections
          if (exception?.value?.startsWith("Non-Error")) {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const serializedData: any = event.extra?.__serialized__;

            if (!serializedData) return null; // if no data is attached, ignore error

            const actualErrorMessage = serializedData.error
              ? serializedData.error.message
              : serializedData.message;

            if (!actualErrorMessage) return null; // If no message is attached, ignore error

            // Now modify the original error
            exception.value = actualErrorMessage;
            event.message = actualErrorMessage;
          }

          return event;
        },
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (appsmithConfigs.smartLook.enabled && !(window as any).smartlook) {
      const { id } = appsmithConfigs.smartLook;

      AnalyticsUtil.initializeSmartLook(id);
    }

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (appsmithConfigs.segment.enabled && !(window as any).analytics) {
      if (appsmithConfigs.segment.apiKey) {
        // This value is only enabled for Appsmith's cloud hosted version. It is not set in self-hosted environments
        await AnalyticsUtil.initializeSegment(appsmithConfigs.segment.apiKey);
      } else if (appsmithConfigs.segment.ceKey) {
        // This value is set in self-hosted environments. But if the analytics are disabled, it's never used.
        await AnalyticsUtil.initializeSegment(appsmithConfigs.segment.ceKey);
      }
    }

    if (
      !currentUser.isAnonymous &&
      currentUser.username !== ANONYMOUS_USERNAME
    ) {
      await AnalyticsUtil.identifyUser(currentUser);
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

export const INTERACTION_ANALYTICS_EVENT = "INTERACTION_ANALYTICS_EVENT";

export interface InteractionAnalyticsEventDetail {
  key?: string;
  propertyName?: string;
  propertyType?: string;
  widgetType?: string;
}

export const interactionAnalyticsEvent = (
  detail: InteractionAnalyticsEventDetail = {},
) =>
  new CustomEvent(INTERACTION_ANALYTICS_EVENT, {
    bubbles: true,
    detail,
  });

export function emitInteractionAnalyticsEvent<T extends HTMLElement>(
  element: T | null,
  args: Record<string, unknown>,
) {
  element?.dispatchEvent(interactionAnalyticsEvent(args));
}

export const DS_EVENT = "DS_EVENT";

export enum DSEventTypes {
  KEYPRESS = "KEYPRESS",
}

export interface DSEventDetail {
  component: string;
  event: DSEventTypes;
  meta: Record<string, unknown>;
}

export function createDSEvent(detail: DSEventDetail) {
  return new CustomEvent(DS_EVENT, {
    bubbles: true,
    detail,
  });
}

export function emitDSEvent<T extends HTMLElement>(
  element: T | null,
  args: DSEventDetail,
) {
  element?.dispatchEvent(createDSEvent(args));
}

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

export const createNewApiName = (
  actions: ActionDataState,
  entityId: string,
  key: CreateNewActionKeyInterface = CreateNewActionKey.PAGE,
) => {
  const pageApiNames = actions // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => a.config[key] === entityId)
    .map((a) => a.config.name);

  return getNextEntityName("Api", pageApiNames);
};

export const createNewJSFunctionName = (
  jsActions: JSCollectionData[],
  entityId: string,
  key: CreateNewActionKeyInterface = CreateNewActionKey.PAGE,
) => {
  const pageJsFunctionNames = jsActions // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => a.config[key] === entityId)
    .map((a) => a.config.name);

  return getNextEntityName("JSObject", pageJsFunctionNames);
};

export const noop = () => {
  log.debug("noop");
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stopEventPropagation = (e: any) => {
  e.stopPropagation();
};

export const createNewQueryName = (
  queries: ActionDataState,
  entityId: string,
  prefix = "Query",
  key: CreateNewActionKeyInterface = CreateNewActionKey.PAGE,
) => {
  const pageApiNames = queries // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => a.config[key] === entityId)
    .map((a) => a.config.name);

  return getNextEntityName(prefix, pageApiNames);
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const getInitialsFromName = (fullName: string) => {
  let inits = "";

  // if name contains space. eg: "Full Name"
  if (fullName && fullName.includes(" ")) {
    const namesArr = fullName.split(" ");
    let initials = namesArr
      .map((name: string) => name.charAt(0))
      .join("")
      .toUpperCase();

    initials = initials;
    inits = initials.slice(0, 2);
  } else {
    // handle for camelCase
    const str = fullName ? fullName.replace(/([a-z])([A-Z])/g, "$1 $2") : "";
    const namesArr = str.split(" ");
    const initials = namesArr
      .map((name: string) => name.charAt(0))
      .join("")
      .toUpperCase();

    inits = initials.slice(0, 2);
  }

  return inits;
};

export const getInitialsAndColorCode = (
  fullName = "",
  colorPalette: string[],
): string[] => {
  const initials = getInitialsFromName(fullName);
  const colorCode = getColorCode(initials, colorPalette);

  return [initials, colorCode];
};
export const getInitials = (
  // colorPalette: string[],
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullName: any,
): string => {
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

  // const colorCode = getColorCode(inits, colorPalette);
  return inits;
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

export function hexToRgb(hex: string): {
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

/*
 * Function to call the given function until the promise it returns resolves or the max retries are reached
 *
 * @param fn - function that returns a promise
 * @param retriesLeft - number of retries
 * @param interval - interval between retries
 * @param shouldRetry - function to determine if the promise should be retried, helpful when we want to retry only on specific errors
 * @returns Promise
 *
 */
export const retryPromise = async (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: () => Promise<any>,
  retriesLeft = 5,
  interval = 1000,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldRetry = (e: Error) => true, // default to retry on all errors
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((e) => {
        if (shouldRetry(e)) {
          setTimeout(async () => {
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
        }
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
export const createBlobUrl = (data: Blob | MediaSource, type: string) => {
  let url = URL.createObjectURL(data);

  url = url.replace(`${window.location.origin}/`, "");

  return `${url}?type=${type}`;
};

/**
 *
 * @param blobId string blob id along with type.
 * @returns [string,string] [blobUrl, type]
 */
export const parseBlobUrl = (blobId: string) => {
  const url = `blob:${window.location.origin}/${blobId.substring(5)}`;

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
  const regEx =
    /[A-Z\xC0-\xD6\xD8-\xDE]?[a-z\xDF-\xF6\xF8-\xFF]+|[A-Z\xC0-\xD6\xD8-\xDE]+(?![a-z\xDF-\xF6\xF8-\xFF])|\d+/g;
  const words = sourceString.match(regEx);

  if (words) {
    words.forEach(function (el, idx) {
      const add = el.toLowerCase();

      out += idx === 0 ? add : add[0].toUpperCase() + add.slice(1);
    });
  }

  return out;
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

// util function to detect current os is Mac
export const isMacOs = () => {
  return osName === "Mac OS";
};

/**
 * checks if array of strings are equal regardless of order
 * @param arr1
 * @param arr2
 * @returns
 */
export function areArraysEqual(arr1: string[], arr2: string[]) {
  if (arr1.length !== arr2.length) return false;

  // Because the array is frozen in strict mode, you'll need to copy the array before sorting it
  if ([...arr1].sort().join(",") === [...arr2].sort().join(",")) return true;

  return false;
}

export enum DataType {
  OBJECT = "OBJECT",
  NUMBER = "NUMBER",
  ARRAY = "ARRAY",
  BOOLEAN = "BOOLEAN",
  STRING = "STRING",
  NULL = "NULL",
  UNDEFINED = "UNDEFINED",
}

export function getDatatype(value: unknown) {
  if (typeof value === "string") {
    return DataType.STRING;
  } else if (typeof value === "number") {
    return DataType.NUMBER;
  } else if (typeof value === "boolean") {
    return DataType.BOOLEAN;
  } else if (isPlainObject(value)) {
    return DataType.OBJECT;
  } else if (Array.isArray(value)) {
    return DataType.ARRAY;
  } else if (value === null) {
    return DataType.NULL;
  } else if (value === undefined) {
    return DataType.UNDEFINED;
  }
}

function extractSentryException(event: Sentry.Event) {
  if (!event.exception) return null;

  const value = event.exception.values ? event.exception.values[0] : null;

  return value;
}
