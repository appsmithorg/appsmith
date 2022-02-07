import React from "react";
import { GridDefaults } from "constants/WidgetConstants";
import lottie from "lottie-web";
import confetti from "assets/lottie/binding.json";
import welcomeConfetti from "assets/lottie/welcome-confetti.json";
import successAnimation from "assets/lottie/success-animation.json";
import {
  DATA_TREE_KEYWORDS,
  JAVASCRIPT_KEYWORDS,
  WINDOW_OBJECT_METHODS,
  WINDOW_OBJECT_PROPERTIES,
} from "constants/WidgetValidation";
import { GLOBAL_FUNCTIONS } from "./autocomplete/EntityDefinitions";
import { get, set } from "lodash";
import { Org } from "constants/orgConstants";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import { User } from "constants/userConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import { sha256 } from "js-sha256";
import moment from "moment";
import log from "loglevel";
import { extraLibrariesNames, isDynamicValue } from "./DynamicBindingUtils";
import { ApiResponse } from "api/ApiResponses";
import { DSLWidget } from "widgets/constants";
import * as Sentry from "@sentry/react";

const { cloudHosting, intercomAppID } = getAppsmithConfigs();

export const snapToGrid = (
  columnWidth: number,
  rowHeight: number,
  x: number,
  y: number,
) => {
  const snappedX = Math.round(x / columnWidth);
  const snappedY = Math.round(y / rowHeight);
  return [snappedX, snappedY];
};

export const formatBytes = (bytes: string | number) => {
  if (!bytes) return;
  const value = typeof bytes === "string" ? parseInt(bytes) : bytes;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (value === 0) return "0 bytes";
  const i = parseInt(String(Math.floor(Math.log(value) / Math.log(1024))));
  if (i === 0) return bytes + " " + sizes[i];
  return (value / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
};

export const getAbsolutePixels = (size?: string | null) => {
  if (!size) return 0;
  const _dex = size.indexOf("px");
  if (_dex === -1) return 0;
  return parseInt(size.slice(0, _dex), 10);
};

export const Directions: { [id: string]: string } = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
  RIGHT_BOTTOM: "RIGHT_BOTTOM",
};

export type Direction = typeof Directions[keyof typeof Directions];
const SCROLL_THRESHOLD = 20;

export const getScrollByPixels = function(
  elem: {
    top: number;
    height: number;
  },
  scrollParent: Element,
  child: Element,
): {
  scrollAmount: number;
  speed: number;
} {
  const scrollParentBounds = scrollParent.getBoundingClientRect();
  const scrollChildBounds = child.getBoundingClientRect();
  const scrollAmount =
    2 *
    GridDefaults.CANVAS_EXTENSION_OFFSET *
    GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  const topBuff =
    elem.top + scrollChildBounds.top > 0
      ? elem.top +
        scrollChildBounds.top -
        SCROLL_THRESHOLD -
        scrollParentBounds.top
      : 0;
  const bottomBuff =
    scrollParentBounds.bottom -
    (elem.top + elem.height + scrollChildBounds.top + SCROLL_THRESHOLD);
  if (topBuff < SCROLL_THRESHOLD) {
    const speed = Math.max(
      (SCROLL_THRESHOLD - topBuff) / (2 * SCROLL_THRESHOLD),
      0.1,
    );
    return {
      scrollAmount: 0 - scrollAmount,
      speed,
    };
  }
  if (bottomBuff < SCROLL_THRESHOLD) {
    const speed = Math.max(
      (SCROLL_THRESHOLD - bottomBuff) / (2 * SCROLL_THRESHOLD),
      0.1,
    );
    return {
      scrollAmount,
      speed,
    };
  }
  return {
    scrollAmount: 0,
    speed: 0,
  };
};

export const scrollElementIntoParentCanvasView = (
  el: {
    top: number;
    height: number;
  } | null,
  parent: Element | null,
  child: Element | null,
) => {
  if (el) {
    const scrollParent = parent;
    if (scrollParent && child) {
      const { scrollAmount: scrollBy } = getScrollByPixels(
        el,
        scrollParent,
        child,
      );
      if (scrollBy < 0 && scrollParent.scrollTop > 0) {
        scrollParent.scrollBy({ top: scrollBy, behavior: "smooth" });
      }
      if (scrollBy > 0) {
        scrollParent.scrollBy({ top: scrollBy, behavior: "smooth" });
      }
    }
  }
};

export function hasClass(ele: HTMLElement, cls: string) {
  return ele.classList.contains(cls);
}

function addClass(ele: HTMLElement, cls: string) {
  if (!hasClass(ele, cls)) ele.classList.add(cls);
}

function removeClass(ele: HTMLElement, cls: string) {
  if (hasClass(ele, cls)) {
    ele.classList.remove(cls);
  }
}

export const removeSpecialChars = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;
  return value
    .split(separatorRegex)
    .join("_")
    .slice(0, limit || 30);
};

export const flashElement = (
  el: HTMLElement,
  flashTimeout = 1000,
  flashClass = "flash",
) => {
  if (!el) return;
  addClass(el, flashClass);
  setTimeout(() => {
    removeClass(el, flashClass);
  }, flashTimeout);
};

/**
 * flash elements with a background color
 *
 * @param id
 * @param timeout
 * @param flashTimeout
 * @param flashColor
 */
export const flashElementsById = (
  id: string | string[],
  timeout = 0,
  flashTimeout?: number,
  flashClass?: string,
) => {
  let ids: string[] = [];

  if (Array.isArray(id)) {
    ids = ids.concat(id);
  } else {
    ids = ids.concat([id]);
  }

  ids.forEach((id) => {
    setTimeout(() => {
      const el = document.getElementById(id);

      el?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      if (el) flashElement(el, flashTimeout, flashClass);
    }, timeout);
  });
};

export const resolveAsSpaceChar = (value: string, limit?: number) => {
  // ensures that all special characters are disallowed
  // while allowing all utf-8 characters
  const removeSpecialCharsRegex = /`|\~|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\+|\=|\[|\{|\]|\}|\||\\|\'|\<|\,|\.|\>|\?|\/|\""|\;|\:|\s/;
  const duplicateSpaceRegex = /\s+/;
  return value
    .split(removeSpecialCharsRegex)
    .join(" ")
    .split(duplicateSpaceRegex)
    .join(" ")
    .slice(0, limit || 30);
};

export const isMac = () => {
  const platform =
    typeof navigator !== "undefined" ? navigator.platform : undefined;
  return !platform ? false : /Mac|iPod|iPhone|iPad/.test(platform);
};

/**
 * Removes the trailing slashes from the path
 * @param path
 * @example
 * ```js
 * let trimmedUrl = trimTrailingSlash('/url/')
 * console.log(trimmedUrl) //will output /url
 * ```
 * @example
 * ```js
 * let trimmedUrl = trimTrailingSlash('/yet-another-url//')
 * console.log(trimmedUrl) // will output /yet-another-url
 * ```
 */
export const trimTrailingSlash = (path: string) => {
  const trailingUrlRegex = /\/+$/;
  return path.replace(trailingUrlRegex, "");
};

/**
 * checks if ellipsis is active
 * this function is meant for checking the existence of ellipsis by CSS.
 * Since ellipsis by CSS are not part of DOM, we are checking with scroll width\height and offsetidth\height.
 * ScrollWidth\ScrollHeight is always greater than the offsetWidth\OffsetHeight when ellipsis made by CSS is active.
 *
 * @param element
 */
export const isEllipsisActive = (element: HTMLElement | null) => {
  return (
    element &&
    (element.offsetWidth < element.scrollWidth ||
      element.offsetHeight < element.scrollHeight)
  );
};

/**
 * converts array to sentences
 * for e.g - ['Pawan', 'Abhinav', 'Hetu'] --> 'Pawan, Abhinav and Hetu'
 *
 * @param arr string[]
 */
export const convertArrayToSentence = (arr: string[]) => {
  return arr.join(", ").replace(/,\s([^,]+)$/, " and $1");
};

/**
 * checks if the name is conflicting with
 * 1. API names,
 * 2. Queries name
 * 3. Javascript reserved names
 * 4. Few internal function names that are in the evaluation tree
 *
 * return if false name conflicts with anything from the above list
 *
 * @param name
 * @param invalidNames
 */
export const isNameValid = (
  name: string,
  invalidNames: Record<string, any>,
) => {
  return !(
    name in JAVASCRIPT_KEYWORDS ||
    name in DATA_TREE_KEYWORDS ||
    name in GLOBAL_FUNCTIONS ||
    name in WINDOW_OBJECT_PROPERTIES ||
    name in WINDOW_OBJECT_METHODS ||
    name in extraLibrariesNames ||
    name in invalidNames
  );
};

/*
 * Filter out empty items from an array
 * for e.g - ['Pawan', undefined, 'Hetu'] --> ['Pawan', 'Hetu']
 *
 * @param array any[]
 */
export const removeFalsyEntries = (arr: any[]): any[] => {
  return arr.filter(Boolean);
};

/**
 * checks if variable passed is of type string or not
 *
 * for e.g -> 'Pawan' -> true
 * ['Pawan', 'Goku'] -> false
 * { name: "Pawan"} -> false
 */
export const isString = (str: any) => {
  return typeof str === "string" || str instanceof String;
};

/**
 * Returns substring between two set of strings
 * eg ->
 * getSubstringBetweenTwoWords("abcdefgh", "abc", "fgh") -> de
 */

export const getSubstringBetweenTwoWords = (
  str: string,
  startWord: string,
  endWord: string,
) => {
  const endIndexOfStartWord = str.indexOf(startWord) + startWord.length;
  const startIndexOfEndWord = str.lastIndexOf(endWord);

  if (startIndexOfEndWord < endIndexOfStartWord) return "";

  return str.substring(startIndexOfEndWord, endIndexOfStartWord);
};

export const playOnboardingAnimation = () => {
  playLottieAnimation("#root", confetti);
};

export const playWelcomeAnimation = (container: string) => {
  playLottieAnimation(container, welcomeConfetti);
};

export const playOnboardingStepCompletionAnimation = () => {
  playLottieAnimation(".onboarding-step-indicator", successAnimation, {
    "background-color": "white",
    padding: "60px",
  });
};

const playLottieAnimation = (
  selector: string,
  animation: any,
  styles?: any,
) => {
  const container: Element = document.querySelector(selector) as Element;

  if (!container) return;
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    "z-index": 99,
    width: "100%",
    height: "100%",
    ...styles,
  });

  container.appendChild(el);

  const animObj = lottie.loadAnimation({
    container: el,
    animationData: animation,
    loop: false,
  });

  const duration = (animObj.totalFrames / animObj.frameRate) * 1000;

  animObj.play();
  setTimeout(() => {
    container.removeChild(el);
  }, duration);
};

export const getSelectedText = () => {
  if (typeof window.getSelection === "function") {
    const selectionObj = window.getSelection();
    return selectionObj && selectionObj.toString();
  }
};

/**
 * calculates and returns the scrollwidth
 *
 * @returns
 */
export const scrollbarWidth = () => {
  const scrollDiv = document.createElement("div");
  scrollDiv.setAttribute(
    "style",
    "width: 100px; height: 100px; overflow: scroll; position:absolute; top:-9999px;",
  );
  document.body.appendChild(scrollDiv);
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);
  return scrollbarWidth;
};

// Flatten object
// From { isValid: false, settings: { color: false}}
// To { isValid: false, settings.color: false}
export const flattenObject = (data: Record<string, any>) => {
  const result: Record<string, any> = {};
  function recurse(cur: any, prop: any) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for (let i = 0, l = cur.length; i < l; i++)
        recurse(cur[i], prop + "[" + i + "]");
      if (cur.length == 0) result[prop] = [];
    } else {
      let isEmpty = true;
      for (const p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + "." + p : p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(data, "");
  return result;
};

/**
 * renames key in object
 *
 * @param object
 * @param key
 * @param newKey
 * @returns
 */
export const renameKeyInObject = (object: any, key: string, newKey: string) => {
  if (object[key]) {
    set(object, newKey, object[key]);
  }

  return object;
};

// Can be used to check if the user has developer role access to org
export const getCanCreateApplications = (currentOrg: Org) => {
  const userOrgPermissions = currentOrg.userPermissions || [];
  const canManage = isPermitted(
    userOrgPermissions,
    PERMISSION_TYPE.CREATE_APPLICATION,
  );
  return canManage;
};

export const getIsSafeRedirectURL = (redirectURL: string) => {
  try {
    return new URL(redirectURL).origin === window.location.origin;
  } catch (e) {
    return false;
  }
};

export function bootIntercom(user?: User) {
  if (intercomAppID && window.Intercom) {
    let { email, username } = user || {};
    let name;
    if (!cloudHosting) {
      username = sha256(username || "");
      // keep email undefined so that users are prompted to enter it when they reach out on intercom
      email = undefined;
    } else {
      name = user?.name;
    }

    window.Intercom("boot", {
      app_id: intercomAppID,
      user_id: username,
      email,
      // keep name undefined instead of an empty string so that intercom auto assigns a name
      name,
    });
  }
}

export const stopClickEventPropagation = (
  e: React.MouseEvent<HTMLDivElement, MouseEvent>,
) => {
  e.stopPropagation();
};

/**
 *
 * Get text for how much time before an action happened
 * Eg: 1 Month, 12 Seconds
 *
 * @param date 2021-09-08T14:14:12Z
 *
 */
export const howMuchTimeBeforeText = (date: string) => {
  if (!date || !moment.isMoment(moment(date))) {
    return "";
  }

  const now = moment();
  const checkDate = moment(date);
  const years = now.diff(checkDate, "years");
  const months = now.diff(checkDate, "months");
  const days = now.diff(checkDate, "days");
  const hours = now.diff(checkDate, "hours");
  const minutes = now.diff(checkDate, "minutes");
  const seconds = now.diff(checkDate, "seconds");
  if (years > 0) return `${years} yr${years > 1 ? "s" : ""}`;
  else if (months > 0) return `${months} mth${months > 1 ? "s" : ""}`;
  else if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  else if (hours > 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  else if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""}`;
  else return `${seconds} sec${seconds > 1 ? "s" : ""}`;
};

/**
 *
 * Truncate string and append given string in the end
 * eg: Flint Lockwood Diatonic Super Mutating Dynamic Food Replicator
 * -> Flint...
 *
 */
export const truncateString = (
  str: string,
  limit: number,
  appendStr = "...",
) => {
  if (str.length <= limit) return str;
  let _subString = str.substring(0, limit);
  _subString = _subString.trim() + appendStr;
  return _subString;
};

/**
 * returns the modText ( ctrl or command ) based on the user machine
 *
 * @returns
 */
export const modText = () => (isMac() ? <span>&#8984;</span> : "CTRL");

export const undoShortCut = () => <span>{modText()}+Z</span>;

export const redoShortCut = () =>
  isMac() ? (
    <span>
      {modText()}+<span>&#8682;</span>+Z
    </span>
  ) : (
    <span>{modText()}+Y</span>
  );

/**
 * @returns the original string after trimming the string past `?`
 */
export const trimQueryString = (value = "") => {
  const index = value.indexOf("?");
  if (index === -1) return value;
  return value.slice(0, index);
};

/**
 * returns the value in the query string for a key
 */
export const getSearchQuery = (search = "", key: string) => {
  const params = new URLSearchParams(search);
  return decodeURIComponent(params.get(key) || "");
};

/**
 * get query params object
 * ref: https://stackoverflow.com/a/8649003/1543567
 */
export const getQueryParamsObject = () => {
  const search = window.location.search.substring(1);
  if (!search) return {};
  try {
    return JSON.parse(
      '{"' +
        decodeURI(search)
          .replace(/"/g, '\\"')
          .replace(/&/g, '","')
          .replace(/=/g, '":"') +
        '"}',
    );
  } catch (e) {
    log.error(e, "error parsing search string");
    return {};
  }
};

/*
 * unfocus all window selection
 *
 * @param document
 * @param window
 */
export function unFocus(document: Document, window: Window) {
  if (document.getSelection()) {
    document.getSelection()?.empty();
  } else {
    try {
      window.getSelection()?.removeAllRanges();
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

export function getLogToSentryFromResponse(response?: ApiResponse) {
  return response && response?.responseMeta?.status >= 500;
}

/*
 *  Function to merge property pane config of a widget
 *
 */
export const mergeWidgetConfig = (target: any, source: any) => {
  const sectionMap: Record<string, any> = {};

  target.forEach((section: { sectionName: string }) => {
    sectionMap[section.sectionName] = section;
  });

  source.forEach((section: { sectionName: string; children: any[] }) => {
    const targetSection = sectionMap[section.sectionName];

    if (targetSection) {
      Array.prototype.push.apply(targetSection.children, section.children);
    } else {
      target.push(section);
    }
  });

  return target;
};

export const getLocale = () => {
  return navigator.languages?.[0] || "en-US";
};

/**
 * Function to check if the DynamicBindingPathList is valid
 * @param currentDSL
 * @returns
 */
export const captureInvalidDynamicBindingPath = (
  currentDSL: Readonly<DSLWidget>,
) => {
  //Get the dynamicBindingPathList of the current DSL
  const dynamicBindingPathList = get(currentDSL, "dynamicBindingPathList");
  dynamicBindingPathList?.forEach((dBindingPath) => {
    const pathValue = get(currentDSL, dBindingPath.key); //Gets the value for the given dynamic binding path
    /**
     * Checks if dynamicBindingPathList contains a property path that doesn't have a binding
     */
    if (!isDynamicValue(pathValue)) {
      Sentry.captureException(
        new Error(
          `INVALID_DynamicPathBinding_CLIENT_ERROR: Invalid dynamic path binding list: ${currentDSL.widgetName}.${dBindingPath.key}`,
        ),
      );
      return;
    }
  });

  if (currentDSL.children) {
    currentDSL.children.map(captureInvalidDynamicBindingPath);
  }
  return currentDSL;
};
