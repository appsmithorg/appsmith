/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { DependentFeatureFlags } from "@appsmith/selectors/engineSelectors";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPlugins } from "actions/pluginActions";

export const getPageDependencyActions = (
  currentWorkspaceId: string = "",
  featureFlags: DependentFeatureFlags = {},
) => {
  const initActions = [fetchPlugins(), fetchDatasources()];

  const successActions = [
    ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
    ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
  ];

  const errorActions = [
    ReduxActionErrorTypes.FETCH_PLUGINS_ERROR,
    ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
  ];

  return {
    initActions,
    successActions,
    errorActions,
  };
};
