/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ReduxAction } from "../../../actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { ExplorerURLParams } from "ee/pages/Editor/Explorer/helpers";
import type { DependentFeatureFlags } from "ee/selectors/engineSelectors";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPageDSLs } from "actions/pageActions";
import { fetchPlugins } from "actions/pluginActions";
import type { Plugin } from "api/PluginApi";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import type { EditConsolidatedApi } from "sagas/InitSagas";
import {
  convertToBaseParentEntityIdSelector,
  convertToPageIdSelector,
} from "selectors/pageListSelectors";

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
  applicationId: string,
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

export const useParentEntityDetailsFromParams = (
  parentEntityIdProp: string,
  isInsideReconnectModal?: boolean,
) => {
  const baseParentEntityIdProp = useSelector((state) =>
    convertToBaseParentEntityIdSelector(state, parentEntityIdProp),
  );

  const { basePageId } = useParams<ExplorerURLParams>();
  const parentEntityIdQuery = basePageId || "";
  const pageId = useSelector((state) =>
    convertToPageIdSelector(state, basePageId),
  );
  const baseParentEntityIdQuery = pageId || "";

  const parentEntityId = isInsideReconnectModal
    ? parentEntityIdProp
    : parentEntityIdQuery;
  const baseParentEntityId = isInsideReconnectModal
    ? baseParentEntityIdProp
    : baseParentEntityIdQuery;

  const entityType = ActionParentEntityType.PAGE;

  return { baseParentEntityId, parentEntityId, entityType };
};
