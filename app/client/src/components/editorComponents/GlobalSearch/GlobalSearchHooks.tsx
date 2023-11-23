import { INTEGRATION_TABS } from "constants/routes";
import type { Datasource } from "entities/Datasource";
import { keyBy } from "lodash";
import { useAppWideAndOtherDatasource } from "@appsmith/pages/Editor/Explorer/hooks";
import { useMemo } from "react";
import { getPageList, getPagePermissions } from "selectors/editorSelectors";
import {
  getActions,
  getAllPageWidgets,
  getJSCollections,
  getPlugins,
  getRecentDatasourceIds,
} from "@appsmith/selectors/entitiesSelector";
import { useSelector } from "react-redux";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import history from "utils/history";
import type { ActionOperation } from "./utils";
import {
  actionOperations,
  attachKind,
  createQueryOption,
  generateCreateQueryForDSOption,
  generateCreateNewDSOption,
  isMatching,
  SEARCH_ITEM_TYPES,
} from "./utils";
import { PluginType } from "entities/Action";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { createNewQueryAction } from "actions/apiPaneActions";
import type { AppState } from "@appsmith/reducers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasCreateActionPermission,
  getHasCreateDatasourcePermission,
  hasCreateDSActionPermissionInApp,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import type { Plugin } from "api/PluginApi";
import { useModuleOptions } from "@appsmith/utils/moduleInstanceHelpers";

export const useFilteredFileOperations = (query = "") => {
  const { appWideDS = [], otherDS = [] } = useAppWideAndOtherDatasource();
  const plugins = useSelector(getPlugins);
  const moduleOptions = useModuleOptions();

  // helper map for sorting based on recent usage
  const recentlyUsedDSMap = useRecentlyUsedDSMap();

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );

  // get all datasources, app ds listed first
  const allDatasources = [...appWideDS, ...otherDS].filter((ds) =>
    hasCreateDSActionPermissionInApp(
      isFeatureEnabled,
      ds.userPermissions ?? [],
      pagePermissions,
    ),
  );

  return useFilteredAndSortedFileOperations({
    allDatasources,
    canCreateActions,
    canCreateDatasource,
    moduleOptions,
    plugins,
    recentlyUsedDSMap,
    query,
  });
};

export const useFilteredAndSortedFileOperations = ({
  allDatasources = [],
  canCreateActions = true,
  canCreateDatasource = true,
  moduleOptions = [],
  plugins = [],
  query,
  recentlyUsedDSMap = {},
}: {
  allDatasources?: Datasource[];
  canCreateActions?: boolean;
  canCreateDatasource?: boolean;
  moduleOptions?: ActionOperation[];
  plugins?: Plugin[];
  recentlyUsedDSMap?: Record<string, number>;
  query: string;
}) => {
  const fileOperations: ActionOperation[] = [];
  if (!canCreateActions) return fileOperations;

  /**
   *  Work around to get the rest api cloud image.
   *  We don't have it store as a svg
   */
  const actionOps = updateActionOperations(plugins, actionOperations);

  // Add JS Object operation
  fileOperations.push(actionOps[2]);

  // Add Module operations
  if (moduleOptions.length > 0) {
    moduleOptions.map((moduleOp) => fileOperations.push(moduleOp));
  }

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
  fileOperations.push(
    ...actionOps.filter((op) => op.title !== actionOps[2].title),
  );
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

export const useFilteredWidgets = (query: string) => {
  const allWidgets = useSelector(getAllPageWidgets);
  const pages = useSelector(getPageList);
  const pageMap = useMemo(() => keyBy(pages || [], "pageId"), [pages]);
  const searchableWidgets = useMemo(
    () =>
      allWidgets.filter(
        (widget: any) =>
          ["CANVAS_WIDGET", "ICON_WIDGET"].indexOf(widget.type) === -1,
      ),
    [allWidgets],
  );
  return useMemo(() => {
    if (!query) return searchableWidgets;

    return searchableWidgets.filter((widget: any) => {
      const page = pageMap[widget.pageId];
      const isPageNameMatching = isMatching(page?.pageName, query);
      const isWidgetNameMatching = isMatching(widget?.widgetName, query);

      return isWidgetNameMatching || isPageNameMatching;
    });
  }, [query, searchableWidgets, pageMap]);
};

export const useFilteredActions = (query: string) => {
  const actions = useSelector(getActions);
  const pages = useSelector(getPageList) || [];
  const pageMap = keyBy(pages, "pageId");
  return useMemo(() => {
    if (!query) return actions;
    return actions.filter((action: any) => {
      const page = pageMap[action?.config?.pageId];
      const isPageNameMatching = isMatching(page?.pageName, query);
      const isActionNameMatching = isMatching(action?.config?.name, query);

      return isActionNameMatching || isPageNameMatching;
    });
  }, [query, actions, pageMap]);
};

export const useFilteredJSCollections = (query: string) => {
  const jsActions = useSelector(getJSCollections);
  const pages = useSelector(getPageList) || [];
  const pageMap = keyBy(pages, "pageId");

  return useMemo(() => {
    if (!query) return jsActions;

    return jsActions.filter((action: any) => {
      const page = pageMap[action?.config?.pageId];
      const isPageNameMatching = isMatching(page?.pageName, query);
      const isActionNameMatching = isMatching(action?.config?.name, query);

      return isActionNameMatching || isPageNameMatching;
    });
  }, [query, jsActions, pageMap]);
};

export const useFilteredPages = (query: string) => {
  const pages = useSelector(getPageList);

  return useMemo(() => {
    if (!pages) return [];
    if (!query) return attachKind(pages, SEARCH_ITEM_TYPES.page);
    return attachKind(
      pages.filter(
        (page: any) =>
          page.pageName.toLowerCase().indexOf(query?.toLowerCase()) > -1,
      ),
      SEARCH_ITEM_TYPES.page,
    );
  }, [pages, query]);
};

export const useRecentlyUsedDSMap = () => {
  const recentDatasourceIds = useSelector(getRecentDatasourceIds);
  // helper map for sorting based on recent usage
  const recentlyUsedOrderMap = useMemo(
    () =>
      recentDatasourceIds.reduce((map: Record<string, number>, id, index) => {
        map[id] = index;
        return map;
      }, {}),
    [recentDatasourceIds],
  );
  return recentlyUsedOrderMap;
};

export const updateActionOperations = (
  plugins: Plugin[],
  actionOps: ActionOperation[],
) => {
  const restApiPlugin = plugins.find(
    (plugin) => plugin.type === PluginType.API,
  );
  const newApiActionIdx = actionOps.findIndex(
    (op) => op.title === "New blank API",
  );
  if (newApiActionIdx > -1) {
    actionOps[newApiActionIdx].pluginId = restApiPlugin?.id;
  }
  return actionOps;
};

export const getSortedDatasources = (
  datasources: Datasource[],
  recentlyUsedDSMap: Record<string, number>,
) => {
  const sortedDS = datasources.sort((a, b) => {
    const orderA = recentlyUsedDSMap[a.id];
    const orderB = recentlyUsedDSMap[b.id];
    if (orderA !== undefined && orderB !== undefined) {
      return orderA - orderB;
    } else if (orderA !== undefined) {
      return -1;
    } else if (orderB !== undefined) {
      return 1;
    } else {
      return 0;
    }
  });
  return sortedDS;
};
