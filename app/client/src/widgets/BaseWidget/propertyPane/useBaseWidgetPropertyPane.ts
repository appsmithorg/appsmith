import type { PropertyPaneConfig } from "constants/PropertyControlConstants";

export const useBaseWidgetPropertyPane = () => {
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
