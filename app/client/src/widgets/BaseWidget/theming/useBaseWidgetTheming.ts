import type { Stylesheet } from "entities/AppTheming";

export const useBaseWidgetTheming = () => {
  return {
    getStylesheetConfig: (styleSheet: Stylesheet = {}): Stylesheet => {
      return styleSheet;
    },
  };
};
