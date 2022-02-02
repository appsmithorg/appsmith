import React from "react";
import { createNewQueryAction } from "actions/apiPaneActions";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import { Datasource } from "entities/Datasource";
import { keyBy } from "lodash";
import { useAppWideAndOtherDatasource } from "pages/Editor/Explorer/hooks";
import { useMemo } from "react";
import {
  getCurrentApplicationId,
  getPageList,
} from "selectors/editorSelectors";
import {
  getActions,
  getAllPageWidgets,
  getJSCollections,
  getPlugins,
} from "selectors/entitiesSelector";
import { useSelector } from "store";
import { EventLocation } from "utils/AnalyticsUtil";
import history from "utils/history";
import {
  actionOperations,
  attachKind,
  isMatching,
  SEARCH_ITEM_TYPES,
} from "./utils";
import AddDatasourceIcon from "remixicon-react/AddBoxLineIcon";
import { Colors } from "constants/Colors";
import { PluginType } from "entities/Action";

export const useFilteredFileOperations = (query = "") => {
  const { appWideDS = [], otherDS = [] } = useAppWideAndOtherDatasource();
  /**
   *  Work around to get the rest api cloud image.
   *  We don't have it store as an svg
   */
  const plugins = useSelector(getPlugins);
  const restApiPlugin = plugins.find(
    (plugin) => plugin.type === PluginType.API,
  );
  const newApiActionIdx = actionOperations.findIndex(
    (op) => op.title === "New Blank API",
  );
  if (newApiActionIdx > -1) {
    actionOperations[newApiActionIdx].pluginId = restApiPlugin?.id;
  }
  const applicationId = useSelector(getCurrentApplicationId);
  return useMemo(() => {
    let fileOperations: any =
      actionOperations.filter((op) =>
        op.title.toLowerCase().includes(query.toLowerCase()),
      ) || [];
    const filteredAppWideDS = appWideDS.filter((ds: Datasource) =>
      ds.name.toLowerCase().includes(query.toLowerCase()),
    );
    const otherFilteredDS = otherDS.filter((ds: Datasource) =>
      ds.name.toLowerCase().includes(query.toLowerCase()),
    );
    if (filteredAppWideDS.length > 0 || otherFilteredDS.length > 0) {
      fileOperations = [
        ...fileOperations,
        {
          title: "CREATE A QUERY",
          kind: SEARCH_ITEM_TYPES.sectionTitle,
        },
      ];
    }
    if (filteredAppWideDS.length > 0) {
      fileOperations = [
        ...fileOperations,
        ...filteredAppWideDS.map((ds: any) => ({
          title: `New ${ds.name} Query`,
          desc: `Create a query in ${ds.name}`,
          pluginId: ds.pluginId,
          kind: SEARCH_ITEM_TYPES.actionOperation,
          action: (pageId: string, from: EventLocation) =>
            createNewQueryAction(pageId, from, ds.id),
        })),
      ];
    }
    if (otherFilteredDS.length > 0) {
      fileOperations = [
        ...fileOperations,
        ...otherFilteredDS.map((ds: any) => ({
          title: `New ${ds.name} Query`,
          desc: `Create a query in ${ds.name}`,
          kind: SEARCH_ITEM_TYPES.actionOperation,
          pluginId: ds.pluginId,
          action: (pageId: string, from: EventLocation) =>
            createNewQueryAction(pageId, from, ds.id),
        })),
      ];
    }
    fileOperations = [
      ...fileOperations,
      {
        title: "New Datasource",
        icon: <AddDatasourceIcon color={Colors.DOVE_GRAY2} size={20} />,
        kind: SEARCH_ITEM_TYPES.actionOperation,
        redirect: (pageId: string) => {
          history.push(
            INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
          );
        },
      },
    ];
    return fileOperations;
  }, [query, appWideDS, otherDS]);
};

export const useFilteredWidgets = (query: string) => {
  const allWidgets = useSelector(getAllPageWidgets);
  const pages = useSelector(getPageList) || [];
  const pageMap = keyBy(pages, "pageId");
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
  }, [allWidgets, query, pages]);
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
  }, [actions, query, pages]);
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
  }, [jsActions, query, pages]);
};

export const useFilteredPages = (query: string) => {
  const pages = useSelector(getPageList) || [];
  return useMemo(() => {
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
