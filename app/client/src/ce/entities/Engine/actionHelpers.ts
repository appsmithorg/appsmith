import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPageDSLs } from "actions/pageActions";
import { fetchPlugins } from "actions/pluginActions";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPageDependencyActions = (currentWorkspaceId?: string) => {
  const initActions = [fetchPlugins(), fetchDatasources(), fetchPageDSLs()];

  const successActions = [
    ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
    ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
    ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS,
  ];

  const errorActions = [
    ReduxActionErrorTypes.FETCH_PLUGINS_ERROR,
    ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
    ReduxActionErrorTypes.POPULATE_PAGEDSLS_ERROR,
  ];

  return {
    initActions,
    successActions,
    errorActions,
  };
};
