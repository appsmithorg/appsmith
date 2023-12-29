/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { DependentFeatureFlags } from "@appsmith/selectors/engineSelectors";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPageDSLs } from "actions/pageActions";
import { fetchPlugins } from "actions/pluginActions";
import type { EditConsolidatedApi } from "sagas/InitSagas";

export const CreateNewActionKey = {
  PAGE: "pageId",
} as const;

export const ActionParentEntityType = {
  PAGE: "PAGE",
} as const;

export const getPageDependencyActions = (allResponses: EditConsolidatedApi) => {
  const { v1DatasourcesResp, v1PageDSLs, v1PluginsResp } = allResponses || {};
  const initActions = [
    // derive workspaceId from v1/pages response made earlier
    //v1/plugins?workspaceId=someWorkspageId
    // tie response to v1PluginsResp
    fetchPlugins({ v1PluginsResp }),
    // derive workspaceId from v1/pages response made earlier
    //v1/datasources?workspaceId=someWorkspageId
    // tie response to v1DatasourcesResp
    fetchDatasources({ v1DatasourcesResp }),
    //derive page ids from all v1/pages and make the following api calls for every page id, backend should provide a collection of all the responses
    // check from the feature flags response for release_server_dsl_migrations_enabled set migrateDSL to true in the query param
    // perform this api call for everyPageId v1/pages/:pageId?id=somePageId&migrateDSL=!!release_server_dsl_migrations_enabled
    // tie response v1PageDSLs
    fetchPageDSLs({ v1PageDSLs }),
  ] as Array<ReduxAction<unknown>>;

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
