import React from "react";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import lottie from "lottie-web";
import confetti from "assets/lottie/binding.json";
import welcomeConfetti from "assets/lottie/welcome-confetti.json";
import successAnimation from "assets/lottie/success-animation.json";
import {
  DATA_TREE_KEYWORDS,
  DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS,
  JAVASCRIPT_KEYWORDS,
} from "constants/WidgetValidation";
import { get, set, isNil, has, uniq } from "lodash";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";
import moment from "moment";
import { isDynamicValue } from "./DynamicBindingUtils";
import type { ApiResponse } from "api/ApiResponses";
import type { DSLWidget } from "widgets/constants";
import * as Sentry from "@sentry/react";
import { matchPath } from "react-router";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  VIEWER_CUSTOM_PATH,
  VIEWER_PATH,
  VIEWER_PATH_DEPRECATED,
} from "constants/routes";
import history from "./history";
import { APPSMITH_GLOBAL_FUNCTIONS } from "components/editorComponents/ActionCreator/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { checkContainerScrollable } from "widgets/WidgetUtils";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import type { WidgetProps } from "widgets/BaseWidget";
import { getContainerIdForCanvas } from "sagas/WidgetOperationUtils";

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

export type Direction = (typeof Directions)[keyof typeof Directions];
const SCROLL_THRESHOLD = 20;

export const getScrollByPixels = function (
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

      if (el) flashElement(el, flashTimeout, flashClass);
    }, timeout);
  });
};

/**
 * Scrolls to the widget of WidgetId without any animantion.
 * @param widgetId
 * @param canvasWidgets
 */
export const quickScrollToWidget = (
  widgetId: string,
  canvasWidgets: CanvasWidgetsReduxState,
) => {
  if (!widgetId || widgetId === "") return;
  window.requestIdleCallback(() => {
    const el = document.getElementById(widgetId);
    const canvas = document.getElementById("canvas-viewport");

    if (el && canvas && !isElementVisibleInContainer(el, canvas)) {
      const scrollElement = getWidgetElementToScroll(widgetId, canvasWidgets);
      if (scrollElement) {
        scrollElement.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "smooth",
        });
      }
    }
  });
};

// Checks if the element in a container is visible or not.
// Can be used to decide if scroll is needed
function isElementVisibleInContainer(
  element: HTMLElement,
  container: HTMLElement,
) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return (
    ((elementRect.top > containerRect.top &&
      elementRect.top < containerRect.bottom) ||
      (elementRect.bottom < containerRect.bottom &&
        elementRect.bottom > containerRect.top)) &&
    ((elementRect.left > containerRect.left &&
      elementRect.left < containerRect.right) ||
      (elementRect.right < containerRect.right &&
        elementRect.right > containerRect.left))
  );
}

function getWidgetElementToScroll(
  widgetId: string,
  canvasWidgets: CanvasWidgetsReduxState,
) {
  const widget = canvasWidgets[widgetId];
  const parentId = widget.parentId || "";
  const containerId = getContainerIdForCanvas(parentId);
  if (containerId === MAIN_CONTAINER_WIDGET_ID) {
    if (widget.type !== "MODAL_WIDGET") {
      return document.getElementById(widgetId);
    }
  }
  const containerWidget = canvasWidgets[
    containerId
  ] as ContainerWidgetProps<WidgetProps>;
  if (checkContainerScrollable(containerWidget)) {
    return document.getElementById(widgetId);
  } else {
    return document.getElementById(containerId);
  }
}

export const resolveAsSpaceChar = (value: string, limit?: number) => {
  // ensures that all special characters are disallowed
  // while allowing all utf-8 characters
  const removeSpecialCharsRegex =
    /`|\~|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\+|\=|\[|\{|\]|\}|\||\\|\'|\<|\,|\.|\>|\?|\/|\""|\;|\:|\s/;
  const duplicateSpaceRegex = /\s+/;
  return value
    .split(removeSpecialCharsRegex)
    .join(" ")
    .split(duplicateSpaceRegex)
    .join(" ")
    .slice(0, limit || 30);
};

export const PLATFORM_OS = {
  MAC: "MAC",
  IOS: "IOS",
  LINUX: "LINUX",
  ANDROID: "ANDROID",
  WINDOWS: "WINDOWS",
};

const platformOSRegex = {
  [PLATFORM_OS.MAC]: /mac.*/i,
  [PLATFORM_OS.IOS]: /(?:iphone|ipod|ipad|Pike v.*)/i,
  [PLATFORM_OS.LINUX]: /(?:linux.*)/i,
  [PLATFORM_OS.ANDROID]: /android.*|aarch64|arm.*/i,
  [PLATFORM_OS.WINDOWS]: /win.*/i,
};

export const getPlatformOS = () => {
  const browserPlatform =
    typeof navigator !== "undefined" ? navigator.platform : null;
  if (browserPlatform) {
    const platformOSList = Object.entries(platformOSRegex);
    const platform = platformOSList.find(([, regex]) =>
      regex.test(browserPlatform),
    );
    return platform ? platform[0] : null;
  }
  return null;
};

export const isMacOrIOS = () => {
  const platformOS = getPlatformOS();
  return platformOS === PLATFORM_OS.MAC || platformOS === PLATFORM_OS.IOS;
};

export const getBrowserInfo = () => {
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : null;

  if (userAgent) {
    let specificMatch;
    let match =
      userAgent.match(
        /(opera|chrome|safari|firefox|msie|CriOS|trident(?=\/))\/?\s*(\d+)/i,
      ) || [];

    // browser
    if (/CriOS/i.test(match[1])) match[1] = "Chrome";

    if (match[1] === "Chrome") {
      specificMatch = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
      if (specificMatch) {
        const opera = specificMatch.slice(1);
        return {
          browser: opera[0].replace("OPR", "Opera"),
          version: opera[1],
        };
      }

      specificMatch = userAgent.match(/\b(Edg)\/(\d+)/);
      if (specificMatch) {
        const edge = specificMatch.slice(1);
        return {
          browser: edge[0].replace("Edg", "Edge (Chromium)"),
          version: edge[1],
        };
      }
    }

    // version
    match = match[2]
      ? [match[1], match[2]]
      : [navigator.appName, navigator.appVersion, "-?"];
    const version = userAgent.match(/version\/(\d+)/i);

    version && match.splice(1, 1, version[1]);

    return { browser: match[0], version: match[1] };
  }
  return null;
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
 * Using clientWidth to fix this https://stackoverflow.com/a/21064102/8692954
 * @param element
 */
export const isEllipsisActive = (element: HTMLElement | null) => {
  return element && element.clientWidth < element.scrollWidth;
};

export const isVerticalEllipsisActive = (element: HTMLElement | null) => {
  return element && element.clientHeight < element.scrollHeight;
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
    has(JAVASCRIPT_KEYWORDS, name) ||
    has(DATA_TREE_KEYWORDS, name) ||
    has(DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS, name) ||
    has(APPSMITH_GLOBAL_FUNCTIONS, name) ||
    has(invalidNames, name)
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

// Can be used to check if the user has developer role access to workspace
export const getCanCreateApplications = (currentWorkspace: Workspace) => {
  const userWorkspacePermissions = currentWorkspace.userPermissions || [];
  const canManage = hasCreateNewAppPermission(userWorkspacePermissions ?? []);
  return canManage;
};

export const getIsSafeRedirectURL = (redirectURL: string) => {
  try {
    return (
      new URL(redirectURL, window.location.origin).origin ===
      window.location.origin
    );
  } catch (e) {
    return false;
  }
};

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
export const howMuchTimeBeforeText = (
  date: string,
  options: { lessThanAMinute: boolean } = { lessThanAMinute: false },
) => {
  if (!date || !moment.isMoment(moment(date))) {
    return "";
  }

  const { lessThanAMinute } = options;

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
  else
    return lessThanAMinute
      ? "less than a minute"
      : `${seconds} sec${seconds > 1 ? "s" : ""}`;
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
export const modText = () => (isMacOrIOS() ? <span>&#8984;</span> : "Ctrl +");
export const altText = () => (isMacOrIOS() ? <span>&#8997;</span> : "Alt +");
export const shiftText = () =>
  isMacOrIOS() ? <span>&#8682;</span> : "Shift +";

export const undoShortCut = () => <span>{modText()} Z</span>;

export const redoShortCut = () =>
  isMacOrIOS() ? (
    <span>
      {modText()} {shiftText()} Z
    </span>
  ) : (
    <span>{modText()} Y</span>
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

const BLACKLIST_COLORS = ["#ffffff"];
const HEX_REGEX = /#[0-9a-fA-F]{6}/gi;
const RGB_REGEX = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/gi;

/**
 * extract colors from string
 *
 * @param text
 * @returns
 */
export function extractColorsFromString(text: string) {
  const colors = new Set();

  [...(text.match(RGB_REGEX) || []), ...(text.match(HEX_REGEX) || [])]
    .filter((d) => BLACKLIST_COLORS.indexOf(d.toLowerCase()) === -1)
    .forEach((color) => {
      colors.add(color.toLowerCase());
    });

  return Array.from(colors) as Array<string>;
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

/**
 * Function to handle undefined returned in case of using [].find()
 * @param result
 * @param errorMessage
 * @returns the result if not undefined or throws an Error
 */
export function shouldBeDefined<T>(
  result: T | undefined | null,
  errorMessage: string,
): T {
  if (result === undefined || result === null) {
    throw new TypeError(errorMessage);
  }

  return result;
}

/*
 * Check if a value is null / undefined / empty string
 *
 * @param value: any
 */
export const isEmptyOrNill = (value: any) => {
  return isNil(value) || (isString(value) && value === "");
};

export const isURLDeprecated = (url: string) => {
  return !!matchPath(url, {
    path: [
      trimQueryString(BUILDER_PATH_DEPRECATED),
      trimQueryString(VIEWER_PATH_DEPRECATED),
    ],
    strict: false,
    exact: false,
  });
};

export const matchPath_BuilderSlug = (path: string) =>
  matchPath<{ applicationSlug: string; pageSlug: string; pageId: string }>(
    path,
    {
      path: trimQueryString(BUILDER_PATH),
      strict: false,
      exact: false,
    },
  );

export const matchPath_ViewerSlug = (path: string) =>
  matchPath<{ applicationSlug: string; pageSlug: string; pageId: string }>(
    path,
    {
      path: trimQueryString(VIEWER_PATH),
      strict: false,
      exact: false,
    },
  );

export const matchPath_BuilderCustomSlug = (path: string) =>
  matchPath<{ customSlug: string }>(path, {
    path: trimQueryString(BUILDER_CUSTOM_PATH),
  });

export const matchPath_ViewerCustomSlug = (path: string) =>
  matchPath<{ customSlug: string }>(path, {
    path: trimQueryString(VIEWER_CUSTOM_PATH),
  });

export const getUpdatedRoute = (
  path: string,
  params: Record<string, string>,
) => {
  const updatedPath = path;

  const matchBuilderSlugPath = matchPath_BuilderSlug(path);
  const matchBuilderCustomPath = matchPath_BuilderCustomSlug(path);
  const matchViewerSlugPath = matchPath_ViewerSlug(path);
  const matchViewerCustomPath = matchPath_ViewerCustomSlug(path);

  /*
   * Note: When making changes to the order of these conditions
   * Be sure to check if it is sync with the order of paths AppRouter.ts
   * Context: https://github.com/appsmithorg/appsmith/pull/19833
   */
  if (matchBuilderSlugPath?.params) {
    return getUpdateRouteForSlugPath(
      path,
      matchBuilderSlugPath.params.applicationSlug,
      matchBuilderSlugPath.params.pageSlug,
      params,
    );
  } else if (matchBuilderCustomPath?.params) {
    return getUpdatedRouteForCustomSlugPath(
      path,
      matchBuilderCustomPath.params.customSlug,
      params,
    );
  } else if (matchViewerSlugPath) {
    return getUpdateRouteForSlugPath(
      path,
      matchViewerSlugPath.params.applicationSlug,
      matchViewerSlugPath.params.pageSlug,
      params,
    );
  } else if (matchViewerCustomPath) {
    return getUpdatedRouteForCustomSlugPath(
      path,
      matchViewerCustomPath.params.customSlug,
      params,
    );
  }
  return updatedPath;
};

const getUpdatedRouteForCustomSlugPath = (
  path: string,
  customSlug: string,
  params: Record<string, string>,
) => {
  let updatedPath = path;
  if (params.customSlug) {
    updatedPath = updatedPath.replace(`${customSlug}`, `${params.customSlug}-`);
  } else if (params.applicationSlug && params.pageSlug) {
    updatedPath = updatedPath.replace(
      `${customSlug}`,
      `${params.applicationSlug}/${params.pageSlug}-`,
    );
  }
  return updatedPath;
};

const getUpdateRouteForSlugPath = (
  path: string,
  applicationSlug: string,
  pageSlug: string,
  params: Record<string, string>,
) => {
  let updatedPath = path;
  if (params.customSlug) {
    updatedPath = updatedPath.replace(
      `${applicationSlug}/${pageSlug}`,
      `${params.customSlug}-`,
    );
    return updatedPath;
  }
  if (params.applicationSlug)
    updatedPath = updatedPath.replace(applicationSlug, params.applicationSlug);
  if (params.pageSlug)
    updatedPath = updatedPath.replace(pageSlug, `${params.pageSlug}-`);
  return updatedPath;
};

// to split relative url into array, so specific parts can be bolded on UI preview
export const splitPathPreview = (
  url: string,
  customSlug?: string,
): string | string[] => {
  const slugMatch = matchPath<{ pageId: string; pageSlug: string }>(
    url,
    VIEWER_PATH,
  );

  const customSlugMatch = matchPath<{ pageId: string; customSlug: string }>(
    url,
    VIEWER_CUSTOM_PATH,
  );

  if (!customSlug && slugMatch?.isExact) {
    const { pageSlug } = slugMatch.params;
    const splitUrl = url.split(pageSlug);
    splitUrl.splice(
      1,
      0,
      pageSlug.slice(0, pageSlug.length - 1), // to split -
      pageSlug.slice(pageSlug.length - 1),
    );
    return splitUrl;
  } else if (customSlug && customSlugMatch?.isExact) {
    const { customSlug } = customSlugMatch.params;
    const splitUrl = url.split(customSlug);
    splitUrl.splice(
      1,
      0,
      customSlug.slice(0, customSlug.length - 1), // to split -
      customSlug.slice(customSlug.length - 1),
    );
    return splitUrl;
  }

  return url;
};

export const updateSlugNamesInURL = (params: Record<string, string>) => {
  const { pathname, search } = window.location;
  // Do not update old URLs
  if (isURLDeprecated(pathname)) return;
  const newURL = getUpdatedRoute(pathname, params);
  history.replace(newURL + search);
};

/**
 * Function to get valid supported mimeType for different browsers
 * @param media "video" | "audio"
 * @returns mimeType string
 */
export const getSupportedMimeTypes = (media: "video" | "audio") => {
  const videoTypes = ["webm", "ogg", "mp4", "x-matroska"];
  const audioTypes = ["webm", "ogg", "mp3", "x-matroska"];
  const codecs = [
    "should-not-be-supported",
    "vp9",
    "vp9.0",
    "vp8",
    "vp8.0",
    "avc1",
    "av1",
    "h265",
    "h.265",
    "h264",
    "h.264",
    "opus",
    "pcm",
    "aac",
    "mpeg",
    "mp4a",
  ];
  const supported: Array<string> = [];
  const isSupported = MediaRecorder.isTypeSupported;
  const types = media === "video" ? videoTypes : audioTypes;

  types.forEach((type: string) => {
    const mimeType = `${media}/${type}`;
    // without codecs
    isSupported(mimeType) && supported.push(mimeType);

    // with codecs
    codecs.forEach((codec) =>
      [
        `${mimeType};codecs=${codec}`,
        `${mimeType};codecs=${codec.toUpperCase()}`,
      ].forEach(
        (variation) => isSupported(variation) && supported.push(variation),
      ),
    );
  });
  return supported[0];
};

export function AutoBind(target: any, _: string, descriptor: any) {
  if (typeof descriptor.value === "function")
    descriptor.value = descriptor.value.bind(target);
  return descriptor;
}

/**
 * Add item to an array which could be undefined
 * @param arr1 Base Array (could be undefined)
 * @param item Item to add to array
 * @param makeUnique Should make sure array has unique entries
 * @returns array which includes items from arr1 and item
 */
export function pushToArray(
  item: unknown,
  arr1?: unknown[],
  makeUnique = false,
) {
  if (Array.isArray(arr1)) arr1.push(item);
  else return [item];

  if (makeUnique) return uniq(arr1);
  return arr1;
}

/**
 * Add items to array which could be undefined
 * @param arr1 Base Array (could be undefined)
 * @param items Items to add to arr1
 * @param makeUnique Should make sure array has unique entries
 * @returns array which contains items from arr1 and items
 */
export function concatWithArray(
  items: unknown[],
  arr1?: unknown[],
  makeUnique = false,
) {
  let finalArr: unknown[] = [];
  if (Array.isArray(arr1)) finalArr = arr1.concat(items);
  else finalArr = finalArr.concat(items);

  if (makeUnique) return uniq(finalArr);
  return finalArr;
}
