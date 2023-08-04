import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { useContext } from "react";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";

export interface BaseWidgetEval {
  getDerivedPropertiesMap: (
    derivedPropertiesMap?: DerivedPropertiesMap,
  ) => DerivedPropertiesMap;
  getDefaultPropertiesMap: (
    defaultPropertiesMap?: Record<string, any>,
  ) => Record<string, any>;
  getMetaPropertiesMap: (
    metaPropertiesMap?: Record<string, any>,
  ) => Record<string, any>;
  getLoadingProperties: (
    derivedPropertiesMap: Array<RegExp> | undefined,
  ) => RegExp[] | undefined;
  resetChildrenMetaProperty: (widgetId: string) => void;
}

export const useBaseWidgetEval = () => {
  const { resetChildrenMetaProperty } = useContext(EditorContext);
  const getDerivedPropertiesMap = (
    derivedPropertiesMap: DerivedPropertiesMap = {},
  ) => {
    return derivedPropertiesMap;
  };
  const getDefaultPropertiesMap = (
    defaultPropertiesMap: Record<string, any> = {},
  ) => {
    return defaultPropertiesMap;
  };
  const getMetaPropertiesMap = (
    metaPropertiesMap: Record<string, any> = {},
  ) => {
    return metaPropertiesMap;
  };
  const getLoadingProperties = (
    derivedPropertiesMap: Array<RegExp> | undefined,
  ) => {
    return derivedPropertiesMap;
  };

  const resetChildrenMetaPropertyFn = (widgetId: string) => {
    if (resetChildrenMetaProperty) resetChildrenMetaProperty(widgetId);
  };

  return {
    getDerivedPropertiesMap,
    getDefaultPropertiesMap,
    getMetaPropertiesMap,
    getLoadingProperties,
    resetChildrenMetaProperty: resetChildrenMetaPropertyFn,
  };
};
