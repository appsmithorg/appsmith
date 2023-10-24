import { INTEGRATION_TABS } from "constants/routes";
import type { Datasource } from "entities/Datasource";
import {
  getDatasources,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import { useSelector } from "react-redux";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import history from "utils/history";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { createNewQueryAction } from "actions/apiPaneActions";
import type { AppState } from "@appsmith/reducers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasCreateDatasourceActionPermission,
  getHasCreateDatasourcePermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import {
  type ActionOperation,
  createQueryOption,
  generateCreateQueryForDSOption,
  generateCreateNewDSOption,
} from "components/editorComponents/GlobalSearch/utils";
import { getCurrentPackage } from "@appsmith/selectors/packageSelectors";
import { hasCreateModulePermission } from "@appsmith/utils/permissionHelpers";
import {
  getSortedDatasources,
  updateActionOperations,
  useRecentlyUsedDSMap,
} from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { actionOperations } from "./utils";
import type { Plugin } from "api/PluginApi";

export const useFilteredFileOperations = (query = "") => {
  const allDatasources = useSelector(getDatasources);
  const plugins = useSelector(getPlugins);

  // helper map for sorting based on recent usage
  const recentlyUsedDSMap = useRecentlyUsedDSMap();

  const userPackagePermissions = useSelector(
    (state: AppState) => getCurrentPackage(state)?.userPermissions ?? [],
  );

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateModules = hasCreateModulePermission(userPackagePermissions);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );

  // get all datasources, app ds listed first
  const allDatasourcesWithCreateActionPerm = allDatasources.filter((ds) =>
    getHasCreateDatasourceActionPermission(
      isFeatureEnabled,
      ds.userPermissions ?? [],
    ),
  );

  return useFilteredAndSortedFileOperations({
    query,
    allDatasources: allDatasourcesWithCreateActionPerm,
    recentlyUsedDSMap,
    canCreateModules,
    canCreateDatasource,
    plugins,
  });
};

export const useFilteredAndSortedFileOperations = ({
  allDatasources = [],
  canCreateDatasource = true,
  canCreateModules = true,
  plugins = [],
  query,
  recentlyUsedDSMap = {},
}: {
  query: string;
  allDatasources?: Datasource[];
  recentlyUsedDSMap?: Record<string, number>;
  canCreateModules?: boolean;
  canCreateDatasource?: boolean;
  plugins?: Plugin[];
}) => {
  const fileOperations: ActionOperation[] = [];
  if (!canCreateModules) return fileOperations;

  /**
   *  Work around to get the rest api cloud image.
   *  We don't have it store as a svg
   */
  const actionOps = updateActionOperations(plugins, actionOperations);

  // Add app datasources
  if (allDatasources.length > 0) {
    fileOperations.push(createQueryOption);
  }

  // Sort datasources based on recency
  const datasources = getSortedDatasources(allDatasources, recentlyUsedDSMap);

  const createQueryAction =
    (dsId: string) => (pageId: string, from: EventLocation) =>
      createNewQueryAction(pageId, from, dsId);

  // map into operations
  const dsOperations = datasources.map((ds) =>
    generateCreateQueryForDSOption(ds, createQueryAction(ds.id)),
  );
  fileOperations.push(...dsOperations);

  // Add generic action creation
  fileOperations.push(...actionOps);
  // Filter out based on query
  let filteredFileOperations = fileOperations
    .filter(Boolean)
    .filter((ds) => ds.title.toLowerCase().includes(query.toLowerCase()));
  // Add genetic datasource creation
  const onRedirect = (pageId: string) => {
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
  };

  if (canCreateDatasource)
    filteredFileOperations = generateCreateNewDSOption(
      filteredFileOperations,
      onRedirect,
    );
  return filteredFileOperations;
};
