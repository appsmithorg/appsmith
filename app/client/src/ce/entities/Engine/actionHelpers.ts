/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { DependentFeatureFlags } from "@appsmith/selectors/engineSelectors";
import {
  fetchAppThemesAction,
  fetchSelectedAppThemeAction,
} from "actions/appThemingActions";
import { fetchDatasources } from "actions/datasourceActions";
import {
  fetchJSCollections,
  fetchJSCollectionsForView,
} from "actions/jsActionActions";
import {
  fetchPage,
  fetchPageDSLs,
  fetchPublishedPage,
} from "actions/pageActions";
import { fetchActions, fetchActionsForView } from "actions/pluginActionActions";
import { fetchPlugins } from "actions/pluginActions";

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

export const getPagesActionsThemes = (
  toLoadPageId: string,
  applicationId: string,
  featureFlags: DependentFeatureFlags = {},
) => {
  const initActionsCalls = [
    fetchPage(toLoadPageId, true),
    fetchActions({ applicationId }, []),
    fetchJSCollections({ applicationId }),
    fetchSelectedAppThemeAction(applicationId),
    fetchAppThemesAction(applicationId),
  ];

  const successActionEffects = [
    ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
    ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
    ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
    ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
    ReduxActionTypes.FETCH_PAGE_SUCCESS,
  ];

  const failureActionEffects = [
    ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
    ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
    ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
    ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
    ReduxActionErrorTypes.FETCH_PAGE_ERROR,
  ];

  return {
    initActionsCalls,
    failureActionEffects,
    successActionEffects,
  };
};

export const getPagesActionsThemesForView = (
  toLoadPageId: string,
  applicationId: string,
  featureFlags: DependentFeatureFlags = {},
) => {
  const initActionsCalls: any = [
    fetchActionsForView({ applicationId }),
    fetchJSCollectionsForView({ applicationId }),
    fetchSelectedAppThemeAction(applicationId),
    fetchAppThemesAction(applicationId),
    fetchPublishedPage(toLoadPageId, true, true),
  ];

  const successActionEffects = [
    ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
    ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS,
    ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
    ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
    ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS,
  ];
  const failureActionEffects = [
    ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
    ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR,
    ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
    ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
    ReduxActionErrorTypes.FETCH_PUBLISHED_PAGE_ERROR,
  ];

  return {
    initActionsCalls,
    failureActionEffects,
    successActionEffects,
  };
};
