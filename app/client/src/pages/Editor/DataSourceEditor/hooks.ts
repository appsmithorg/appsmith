import { executeDatasourceQuery } from "actions/datasourceActions";
import type { Datasource, QueryTemplate } from "entities/Datasource";
import { useState, useCallback } from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
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

  //   A/B feature flag for datasource view mode preview data.
  let isEnabledForDSViewModeSchema = useFeatureFlag(
    FEATURE_FLAG.ab_gsheet_schema_enabled,
  );

  const isEnabledForMockMongoSchema = useFeatureFlag(
    FEATURE_FLAG.ab_mock_mongo_schema_enabled,
  );

  // for mongoDB, the feature flag should be based on ab_mock_mongo_schema_enabled.
  if (plugin?.name === PluginName.MONGO) {
    isEnabledForDSViewModeSchema = isEnabledForMockMongoSchema;
  }

  const isPluginAllowedToPreviewData = isEnabledForDSViewModeSchema
    ? DATASOURCES_ALLOWED_FOR_PREVIEW_MODE.includes(plugin?.name || "") ||
      (plugin?.name === PluginName.MONGO &&
        !!(datasource as Datasource)?.isMock) ||
      isGoogleSheetPlugin
    : false;

  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );

  const canCreatePages = getHasCreatePagePermission(
    isGACEnabled,
    userAppPermissions,
  );
  const canCreateDatasourceActions = hasCreateDSActionPermissionInApp(
    isGACEnabled,
    datasourcePermissions,
    pagePermissions,
  );

  const canGeneratePage = canCreateDatasourceActions && canCreatePages;

  const supportTemplateGeneration =
    !isPluginAllowedToPreviewData &&
    !!generateCRUDSupportedPlugin[(datasource as Datasource).pluginId];

  return supportTemplateGeneration && canGeneratePage;
};
