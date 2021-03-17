import { GridDefaults } from "constants/WidgetConstants";
import lottie from "lottie-web";
import confetti from "assets/lottie/binding.json";
import successAnimation from "assets/lottie/success-animation.json";
import {
  DATA_TREE_KEYWORDS,
  JAVASCRIPT_KEYWORDS,
} from "constants/WidgetValidation";
import { GLOBAL_FUNCTIONS } from "./autocomplete/EntityDefinitions";
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
const SCROLL_THESHOLD = 10;

export const getScrollByPixels = function(
  elem: Element,
  scrollParent: Element,
): number {
  const bounding = elem.getBoundingClientRect();
  const scrollParentBounds = scrollParent.getBoundingClientRect();
  const scrollAmount =
    GridDefaults.CANVAS_EXTENSION_OFFSET * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

  if (
    bounding.top > 0 &&
    bounding.top - scrollParentBounds.top < SCROLL_THESHOLD
  )
    return -scrollAmount;
  if (scrollParentBounds.bottom - bounding.bottom < SCROLL_THESHOLD)
    return scrollAmount;
  return 0;
};

export const scrollElementIntoParentCanvasView = (
  el: Element | null,
  parent: Element | null,
) => {
  if (el) {
    const scrollParent = parent;
    if (scrollParent) {
      const scrollBy: number = getScrollByPixels(el, scrollParent);
      if (scrollBy < 0 && scrollParent.scrollTop > 0) {
        scrollParent.scrollBy({ top: scrollBy, behavior: "smooth" });
      }
      if (scrollBy > 0) {
        scrollParent.scrollBy({ top: scrollBy, behavior: "smooth" });
      }
    }
  }
};

export const removeSpecialChars = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;
  return value
    .split(separatorRegex)
    .join("_")
    .slice(0, limit || 30);
};

export const flashElement = (el: HTMLElement) => {
  el.style.backgroundColor = "#FFCB33";
  setTimeout(() => {
    el.style.backgroundColor = "transparent";
  }, 1000);
};

export const flashElementById = (id: string) => {
  const el = document.getElementById(id);
  el?.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  if (el) flashElement(el);
};

export const resolveAsSpaceChar = (value: string, limit?: number) => {
  const separatorRegex = /[^\w\s]/;
  const duplicateSpaceRegex = /\s+/;
  return value
    .split(separatorRegex)
    .join("")
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
    name in invalidNames
  );
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

export const playOnboardingAnimation = () => {
  playLottieAnimation("#root", confetti);
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
