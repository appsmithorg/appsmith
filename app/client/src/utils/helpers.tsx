import { GridDefaults } from "constants/WidgetConstants";
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

export const convertToCamelCase = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;
  return value
    .split(separatorRegex)
    .map((token, index) => {
      if (index > 0) {
        return token.charAt(0).toLocaleUpperCase() + token.slice(1);
      }
      return token;
    })
    .join("_")
    .slice(0, limit || 30);
};
