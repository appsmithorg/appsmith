import type { Stylesheet } from "entities/AppTheming";

export interface BaseWidgetTheming {
  getStylesheetConfig: (styleSheet?: Stylesheet) => Stylesheet;
}

export const useBaseWidgetTheming = (): BaseWidgetTheming => {
  return {
    getStylesheetConfig: (styleSheet: Stylesheet = {}): Stylesheet => {
      return styleSheet;
    },
  };
};
