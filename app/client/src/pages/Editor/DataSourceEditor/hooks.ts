import { executeDatasourceQuery } from "actions/datasourceActions";
import type { Datasource, QueryTemplate } from "entities/Datasource";
import { useCallback, useState } from "react";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { useDispatch, useSelector } from "react-redux";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { PluginName } from "entities/Action";
import { isGoogleSheetPluginDS } from "utils/editorContextUtils";
import {
  getHasCreatePagePermission,
  hasCreateDSActionPermissionInApp,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import type { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { DATASOURCES_ALLOWED_FOR_PREVIEW_MODE } from "constants/QueryEditorConstants";
import {
  getGenerateCRUDEnabledPluginMap,
  getPlugin,
} from "@appsmith/selectors/entitiesSelector";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import type { AppState } from "@appsmith/reducers";
import {
  getCurrentApplication,
  getPagePermissions,
} from "selectors/editorSelectors";
import { get } from "lodash";
import { useEditorType } from "@appsmith/hooks";
import history from "utils/history";

interface FetchPreviewData {
  datasourceId: string;
  template: QueryTemplate;
}

interface UseDatasourceQueryReturn {
  fetchPreviewData: (data: FetchPreviewData) => void;
  isLoading: boolean;
  failedFetchingPreviewData: boolean;
}

interface UseDatasourceQueryParams {
  setPreviewData: (data: any) => void;
  setPreviewDataError: (string: any) => void;
}

export const useDatasourceQuery = ({
  setPreviewData,
  setPreviewDataError,
}: UseDatasourceQueryParams): UseDatasourceQueryReturn => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [failedFetchingPreviewData, setFailedFetchingPreviewData] =
    useState(false);

  const onFetchPreviewDataSuccess = useCallback((payload: any) => {
    setIsLoading(false);

    if (payload.data && payload.data.body) {
      if (Array.isArray(payload.data?.body)) {
        setPreviewData(payload.data?.body);
      } else {
        // if the response from the server is anything but an array of data, set the error flag
        setFailedFetchingPreviewData(true);
        AnalyticsUtil.logEvent("DATA_FETCH_FAILED_POST_SCHEMA_FETCH", {
          error: payload.data?.pluginErrorDetails,
        });
      }
    }
  }, []);

  const onFetchPreviewDataFailure = useCallback((error: any) => {
    setIsLoading(false);
    setFailedFetchingPreviewData(true);
    AnalyticsUtil.logEvent("DATA_FETCH_FAILED_POST_SCHEMA_FETCH", {
      error: error,
    });
  }, []);

  const fetchPreviewData = useCallback(
    (data: FetchPreviewData) => {
      setIsLoading(true);
      setFailedFetchingPreviewData(false);

      // reset states
      setPreviewDataError(false);
      setPreviewData([]);

      dispatch(
        executeDatasourceQuery({
          payload: {
            ...data,
            isGeneratePage: false,
          },
          onSuccessCallback: onFetchPreviewDataSuccess,
          onErrorCallback: onFetchPreviewDataFailure,
        }),
      );
    },
    [isLoading],
  );

  return {
    fetchPreviewData,
    isLoading,
    failedFetchingPreviewData,
  };
};

export const useShowPageGenerationOnHeader = (
  datasource: Datasource,
): boolean => {
  const pluginId = get(datasource, "pluginId", "");
  const plugin = useSelector((state: AppState) => getPlugin(state, pluginId));
  const userAppPermissions = useSelector(
    (state: AppState) => getCurrentApplication(state)?.userPermissions ?? [],
  );

  const pagePermissions = useSelector(getPagePermissions);

  const datasourcePermissions = datasource?.userPermissions || [];

  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const isGoogleSheetPlugin = isGoogleSheetPluginDS(plugin?.packageName);

  const isPluginAllowedToPreviewData =
    DATASOURCES_ALLOWED_FOR_PREVIEW_MODE.includes(plugin?.name || "") ||
    (plugin?.name === PluginName.MONGO &&
      !!(datasource as Datasource)?.isMock) ||
    isGoogleSheetPlugin;
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );

  const editorType = useEditorType(history.location.pathname);

  const canCreatePages = getHasCreatePagePermission(
    isGACEnabled,
    userAppPermissions,
  );
  const canCreateDatasourceActions = hasCreateDSActionPermissionInApp({
    isEnabled: isGACEnabled,
    dsPermissions: datasourcePermissions,
    pagePermissions,
    editorType,
  });

  const canGeneratePage = canCreateDatasourceActions && canCreatePages;

  const supportTemplateGeneration =
    !isPluginAllowedToPreviewData &&
    !!generateCRUDSupportedPlugin[(datasource as Datasource).pluginId];

  return supportTemplateGeneration && canGeneratePage;
};
