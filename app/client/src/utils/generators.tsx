import { WidgetType } from "constants/WidgetConstants";
import generate from "nanoid/generate";

const ALPHANUMERIC = "1234567890abcdefghijklmnopqrstuvwxyz";
// const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export const generateReactKey = ({
  prefix = "",
}: { prefix?: string } = {}): string => {
  return prefix + generate(ALPHANUMERIC, 10);
};

// Before you change how this works
// This className is used for the following:
// 1. Resize bounds
// 2. Property pane reference for positioning
// 3. Table widget filter pan reference for positioning
export const generateClassName = (seed?: string) => {
  return `appsmith_widget_${seed}`;
};

export const getCanvasClassName = () => "canvas";

export const getNearestParentCanvas = (el: Element | null) => {
  const canvasQuerySelector = `.${getCanvasClassName()}`;
  if (el) return el.closest(canvasQuerySelector);
  return null;
};

export const getNearestWidget = (el: Element | null, type: WidgetType) => {
  const canvasQuerySelector = `div[type="${type}"]`;
  if (el) return el.closest(canvasQuerySelector);
  return null;
};

export default {
  generateReactKey,
  generateClassName,
};
