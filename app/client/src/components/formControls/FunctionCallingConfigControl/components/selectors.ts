import type { AppState } from "ee/reducers";
import {
  getActions,
  getJSCollections,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import { createSelector } from "reselect";
import type {
  FunctionCallingEntityType,
  FunctionCallingEntityTypeOption,
} from "../types";

export const selectQueryEntityOptions = (
  state: AppState,
): FunctionCallingEntityTypeOption[] => {
  const plugins = getPlugins(state);

  return (
    getActions(state)
      // TODO: Remove filtering once AIChat is a separate entity
      .filter(
        (action) =>
          action.config.pluginType !== "AI" &&
          // @ts-expect-error No way to narrow down proper type
          action.config.pluginName !== "Appsmith AI",
      )
      .map(({ config }) => ({
        id: config.id,
        name: config.name,
        pluginId: config.pluginId,
      }))
      .map((action) => {
        const iconSrc = plugins.find(
          (plugin) => plugin.id === action.pluginId,
        )?.iconLocation;

        return {
          value: action.id,
          label: action.name,
          optionGroupType: "Query",
          iconSrc,
        };
      })
  );
};

const selectJsFunctionEntityOptions = (
  state: AppState,
): FunctionCallingEntityTypeOption[] => {
  return getJSCollections(state).flatMap((jsCollection) => {
    return jsCollection.config.actions.map((jsFunction) => {
      return {
        value: jsFunction.id,
        label: jsFunction.name,
        optionGroupType: "JSFunction",
      };
    });
  });
};

export const selectEntityOptions = createSelector(
  selectQueryEntityOptions,
  selectJsFunctionEntityOptions,
  (
    queryItems,
    jsItems,
  ): Record<FunctionCallingEntityType, FunctionCallingEntityTypeOption[]> => {
    return {
      Query: queryItems,
      JSFunction: jsItems,
    };
  },
);
