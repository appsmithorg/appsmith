import { executeDatasourceQuery } from "actions/datasourceActions";
import type { Datasource, QueryTemplate } from "entities/Datasource";
import { useCallback, useState } from "react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useDispatch, useSelector } from "react-redux";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { PluginName } from "entities/Action";
import { isGoogleSheetPluginDS } from "utils/editorContextUtils";
import {
  getHasCreatePagePermission,
  hasCreateDSActionPermissionInApp,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { DATASOURCES_ALLOWED_FOR_PREVIEW_MODE } from "constants/QueryEditorConstants";
import {
  getGenerateCRUDEnabledPluginMap,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { AppState } from "ee/reducers";
import { getPagePermissions } from "selectors/editorSelectors";
import { get } from "lodash";
import { useEditorType } from "ee/hooks";
import history from "utils/history";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPreviewData: (data: any) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const releaseDragDropBuildingBlocks = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );

  const isPluginAllowedToPreviewData =
    DATASOURCES_ALLOWED_FOR_PREVIEW_MODE.includes(plugin?.name || "") ||
    (plugin?.name === PluginName.MONGO &&
      !!(datasource)?.isMock) ||
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
    !!generateCRUDSupportedPlugin[(datasource).pluginId];

  return (
    !releaseDragDropBuildingBlocks && // only show generate page button if dragging of building blocks is not enabled (product decision)
    supportTemplateGeneration &&
    canGeneratePage
  );
};
