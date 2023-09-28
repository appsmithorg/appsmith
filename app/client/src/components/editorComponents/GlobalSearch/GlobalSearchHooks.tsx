import React from "react";
import { INTEGRATION_TABS } from "constants/routes";
import type { Datasource } from "entities/Datasource";
import { keyBy } from "lodash";
import { useAppWideAndOtherDatasource } from "pages/Editor/Explorer/hooks";
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
  isMatching,
  SEARCH_ITEM_TYPES,
} from "./utils";
import { PluginType } from "entities/Action";
import { integrationEditorURL } from "RouteBuilder";
import { EntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { createNewQueryAction } from "actions/apiPaneActions";
import type { AppState } from "@appsmith/reducers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { importRemixIcon } from "design-system-old";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasCreateActionPermission,
  getHasCreateDatasourceActionPermission,
  getHasCreateDatasourcePermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
const AddLineIcon = importRemixIcon(
  () => import("remixicon-react/AddLineIcon"),
);

export const useFilteredFileOperations = (query = "") => {
  const { appWideDS = [], otherDS = [] } = useAppWideAndOtherDatasource();
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
  /**
   *  Work around to get the rest api cloud image.
   *  We don't have it store as a svg
   */
  const plugins = useSelector(getPlugins);
  const restApiPlugin = plugins.find(
    (plugin) => plugin.type === PluginType.API,
  );
  const newApiActionIdx = actionOperations.findIndex(
    (op) => op.title === "New blank API",
  );
  if (newApiActionIdx > -1) {
    actionOperations[newApiActionIdx].pluginId = restApiPlugin?.id;
  }

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

  return useMemo(
    () =>
      getFilteredAndSortedFileOperations(
        query,
        appWideDS,
        otherDS,
        recentlyUsedOrderMap,
        canCreateActions,
        canCreateDatasource,
        pagePermissions,
      ),
    [
      appWideDS,
      canCreateActions,
      canCreateDatasource,
      otherDS,
      pagePermissions,
      query,
      recentlyUsedOrderMap,
    ],
  );
};

export const getFilteredAndSortedFileOperations = (
  query: string,
  appWideDS: Datasource[] = [],
  otherDS: Datasource[] = [],
  recentlyUsedOrderMap: Record<string, number> = {},
  canCreateActions = true,
  canCreateDatasource = true,
  pagePermissions: string[] = [],
  isFeatureEnabled = false,
) => {
  const fileOperations: ActionOperation[] = [];
  if (!canCreateActions) return fileOperations;

  // Add JS Object operation
  fileOperations.push(actionOperations[2]);
  // Add app datasources
  if (appWideDS.length > 0 || otherDS.length > 0) {
    const showCreateQuery = [...appWideDS, ...otherDS].some((ds: Datasource) =>
      getHasCreateDatasourceActionPermission(isFeatureEnabled, [
        ...(ds.userPermissions ?? []),
        ...pagePermissions,
      ]),
    );

    if (showCreateQuery) {
      fileOperations.push({
        desc: "",
        title: "Create a query",
        kind: SEARCH_ITEM_TYPES.sectionTitle,
      });
    }
  }

  // get all datasources, app ds listed first
  const datasources = [...appWideDS, ...otherDS].filter((ds) =>
    getHasCreateDatasourceActionPermission(isFeatureEnabled, [
      ...(ds.userPermissions ?? []),
      ...pagePermissions,
    ]),
  );

  // Sort datasources based on recency
  datasources.sort((a, b) => {
    const orderA = recentlyUsedOrderMap[a.id];
    const orderB = recentlyUsedOrderMap[b.id];
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

  // map into operations
  const dsOperations = datasources.map((ds) => ({
    title: `New ${ds.name} query`,
    shortTitle: `${ds.name} query`,
    desc: `Create a query in ${ds.name}`,
    pluginId: ds.pluginId,
    kind: SEARCH_ITEM_TYPES.actionOperation,
    action: (pageId: string, from: EventLocation) =>
      createNewQueryAction(pageId, from, ds.id),
  }));
  fileOperations.push(...dsOperations);

  // Add generic action creation
  fileOperations.push(
    ...actionOperations.filter((op) => op.title !== actionOperations[2].title),
  );
  // Filter out based on query
  const filteredFileOperations = fileOperations
    .filter(Boolean)
    .filter((ds) => ds.title.toLowerCase().includes(query.toLowerCase()));
  // Add genetic datasource creation
  if (canCreateDatasource) {
    filteredFileOperations.push({
      desc: "Create a new datasource in the organisation",
      title: "New datasource",
      icon: (
        <EntityIcon>
          <AddLineIcon size={22} />
        </EntityIcon>
      ),
      kind: SEARCH_ITEM_TYPES.actionOperation,
      redirect: (pageId: string, entryPoint: string) => {
        history.push(
          integrationEditorURL({
            pageId,
            selectedTab: INTEGRATION_TABS.NEW,
          }),
        );
        // Event for datasource creation click
        AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
          entryPoint,
        });
      },
    });
  }
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
