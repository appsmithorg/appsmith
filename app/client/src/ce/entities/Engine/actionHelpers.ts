/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { DependentFeatureFlags } from "@appsmith/selectors/engineSelectors";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPageDSLs } from "actions/pageActions";
import { fetchPlugins } from "actions/pluginActions";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import { createNewQueryAction } from "actions/apiPaneActions";

export enum ACTION_PARENT_ENTITY_TYPE {
  PAGE = "PAGE",
}

export const createNewQueryBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  dsId: string,
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  if (parentEntityType === ACTION_PARENT_ENTITY_TYPE.PAGE) {
    return createNewQueryAction(entityId, from, dsId);
  }
};

export const getPageDependencyActions = (
  currentWorkspaceId: string = "",
  featureFlags: DependentFeatureFlags = {},
) => {
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
