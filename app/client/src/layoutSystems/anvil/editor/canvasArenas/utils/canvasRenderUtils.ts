import { memoize } from "lodash";

export const getNearestScrollParent: any = (element: HTMLElement | null) => {
  if (!element) return null;
  if (element.scrollHeight > element.clientHeight) {
    return element;
  }
  return getNearestScrollParent(element.parentElement);
};

/**
 * Function to render UX to denote that the widget type cannot be dropped in the layout
 */
export const renderDisallowOnCanvas = (slidingArena: HTMLDivElement) => {
  slidingArena.style.backgroundColor = "#EB714D";
  slidingArena.style.color = "white";
  slidingArena.innerText = "This Layout doesn't support the widget";

  slidingArena.style.textAlign = "center";
  slidingArena.style.opacity = "0.8";
};

export const getDropIndicatorColor = memoize(() => {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue("--anvil-drop-indicator");
});
