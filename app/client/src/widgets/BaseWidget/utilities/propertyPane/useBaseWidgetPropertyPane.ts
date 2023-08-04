import type { PropertyPaneConfig } from "constants/PropertyControlConstants";

export interface BaseWidgetPropertyPane {
  getPropertyPaneConfig: (
    propertyPaneConfig?: PropertyPaneConfig[],
  ) => PropertyPaneConfig[];
  getPropertyPaneContentConfig: (
    contentPropertyPaneConfig?: PropertyPaneConfig[],
  ) => PropertyPaneConfig[];
  getPropertyPaneStyleConfig: (
    stylePropertyPaneConfig?: PropertyPaneConfig[],
  ) => PropertyPaneConfig[];
}

export const useBaseWidgetPropertyPane = (): BaseWidgetPropertyPane => {
  const getPropertyPaneConfig = (
    propertyPaneConfig: PropertyPaneConfig[] = [],
  ) => {
    return propertyPaneConfig;
  };
  const getPropertyPaneContentConfig = (
    contentPropertyPaneConfig: PropertyPaneConfig[] = [],
  ) => {
    return contentPropertyPaneConfig;
  };
  const getPropertyPaneStyleConfig = (
    stylePropertyPaneConfig: PropertyPaneConfig[] = [],
  ) => {
    return stylePropertyPaneConfig;
  };
  return {
    getPropertyPaneConfig,
    getPropertyPaneContentConfig,
    getPropertyPaneStyleConfig,
  };
};
