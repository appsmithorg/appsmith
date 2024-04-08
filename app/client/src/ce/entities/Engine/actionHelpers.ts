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
import type { Plugin } from "api/PluginApi";
import type { EditConsolidatedApi } from "sagas/InitSagas";

export const CreateNewActionKey = {
  PAGE: "pageId",
} as const;

export const ActionParentEntityType = {
  PAGE: "PAGE",
} as const;

export const getPageDependencyActions = (
  currentWorkspaceId: string = "",
  featureFlags: DependentFeatureFlags = {},
  allResponses: EditConsolidatedApi,
) => {
  const { datasources, pagesWithMigratedDsl, plugins } = allResponses || {};
  const initActions = [
    fetchPlugins({ plugins }),
    fetchDatasources({ datasources }),
    fetchPageDSLs({ pagesWithMigratedDsl }),
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

export const doesPluginRequireDatasource = (plugin: Plugin | undefined) => {
  return !!plugin && plugin.hasOwnProperty("requiresDatasource")
    ? plugin.requiresDatasource
    : true;
};

export enum APPSMITH_NAMESPACED_FUNCTIONS {}

export const getParentEntityDetailsFromParams = (
  parentEntityIdObject: { pageId?: string },
  parentEntityIdProp: string,
  isInsideReconnectModal?: boolean,
) => {
  const { pageId } = parentEntityIdObject;
  const parentEntityIdQuery = pageId || "";
  const parentEntityId = isInsideReconnectModal
    ? parentEntityIdProp
    : parentEntityIdQuery;
  const entityType = ActionParentEntityType.PAGE;
  return { parentEntityId, entityType };
};
