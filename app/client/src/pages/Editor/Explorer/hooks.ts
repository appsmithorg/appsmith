import {
  useEffect,
  MutableRefObject,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { compact, get, groupBy } from "lodash";
import { Datasource } from "entities/Datasource";
import { isStoredDatasource } from "entities/Action";
import { debounce } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import log from "loglevel";
import produce from "immer";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { getActions, getDatasources } from "selectors/entitiesSelector";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { matchPath, useLocation } from "react-router";
import {
  API_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import { SAAS_EDITOR_API_ID_PATH } from "../SaaSEditor/constants";

const findWidgets = (widgets: CanvasStructure, keyword: string) => {
  if (!widgets || !widgets.widgetName) return widgets;
  const widgetNameMached =
    widgets.widgetName.toLowerCase().indexOf(keyword) > -1;
  if (widgets.children) {
    widgets.children = compact(
      widgets.children.map((widget: CanvasStructure) =>
        findWidgets(widget, keyword),
      ),
    );
  }
  if (widgetNameMached || (widgets.children && widgets.children.length > 0)) {
    return widgets;
  }
};

const findDataSources = (dataSources: Datasource[], keyword: string) => {
  return dataSources.filter(
    (dataSource: Datasource) =>
      dataSource.name.toLowerCase().indexOf(keyword.toLowerCase()) > -1,
  );
};

export const useDatasourcesPageMapInCurrentApplication = () => {
  const actions = useActions();
  const reducerDatasources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });
  return useMemo(() => {
    const datasourcesPageMap: Record<string, Datasource[]> = {};
    for (const [key, value] of Object.entries(actions)) {
      const datasourceIds = value.reduce((acc, action) => {
        if (
          isStoredDatasource(action.config.datasource) &&
          action.config.datasource.id
        ) {
          acc.add(action.config.datasource.id);
        }
        return acc;
      }, new Set());
      const activeDatasources = reducerDatasources.filter((datasource) =>
        datasourceIds.has(datasource.id),
      );
      datasourcesPageMap[key] = activeDatasources;
    }

    return datasourcesPageMap;
  }, [actions, reducerDatasources]);
};

export const useAppWideAndOtherDatasource = () => {
  const actions = useSelector(getActions);
  const allDatasources = useSelector(getDatasources);
  const appWideDatasourcesIds = actions.reduce((acc, action: ActionData) => {
    if (
      isStoredDatasource(action.config.datasource) &&
      action.config.datasource.id
    ) {
      acc.add(action.config.datasource.id);
    }
    return acc;
  }, new Set());
  return allDatasources
    .sort((ds1, ds2) =>
      ds1.name?.toLowerCase()?.localeCompare(ds2.name?.toLowerCase()),
    )
    .reduce(
      (acc: any, ds) => {
        if (appWideDatasourcesIds.has(ds.id)) {
          acc.appWideDS = acc.appWideDS.concat(ds);
        } else {
          acc.otherDS = acc.otherDS.concat(ds);
        }
        return acc;
      },
      { appWideDS: [], otherDS: [] },
    );
};

export const useFilteredDatasources = (searchKeyword?: string) => {
  const pageIds = usePageIds(searchKeyword);
  const datasources = useDatasourcesPageMapInCurrentApplication();
  return useMemo(() => {
    if (searchKeyword) {
      const start = performance.now();
      const filteredDatasources = produce(datasources, (draft) => {
        for (const [key, value] of Object.entries(draft)) {
          if (pageIds.includes(key)) {
            draft[key] = value;
          } else {
            draft[key] = findDataSources(value, searchKeyword);
          }
        }
      });
      log.debug("Filtered datasources in:", performance.now() - start, "ms");
      return filteredDatasources;
    }

    return datasources;
  }, [searchKeyword, datasources]);
};

export const useJSCollections = (searchKeyword?: string) => {
  const reducerActions = useSelector(
    (state: AppState) => state.entities.jsActions,
  );
  const pageIds = usePageIds(searchKeyword);

  const actions = useMemo(() => {
    return groupBy(reducerActions, "config.pageId");
  }, [reducerActions]);

  return useMemo(() => {
    if (searchKeyword) {
      const start = performance.now();
      const filteredActions = produce(actions, (draft) => {
        for (const [key, value] of Object.entries(draft)) {
          if (pageIds.includes(key)) {
            draft[key] = value;
          } else {
            value.forEach((action, index) => {
              const searchMatches =
                action.config.name
                  .toLowerCase()
                  .indexOf(searchKeyword.toLowerCase()) > -1;
              if (searchMatches) {
                draft[key][index] = action;
              } else {
                delete draft[key][index];
              }
            });
          }
          draft[key] = draft[key].filter(Boolean);
        }
      });
      log.debug("Filtered actions in:", performance.now() - start, "ms");
      return filteredActions;
    }
    return actions;
  }, [searchKeyword, actions]);
};

export const useActions = (searchKeyword?: string) => {
  const reducerActions = useSelector(
    (state: AppState) => state.entities.actions,
  );
  const pageIds = usePageIds(searchKeyword);

  const actions = useMemo(() => {
    return groupBy(reducerActions, "config.pageId");
  }, [reducerActions]);

  return useMemo(() => {
    if (searchKeyword) {
      const start = performance.now();
      const filteredActions = produce(actions, (draft) => {
        for (const [key, value] of Object.entries(draft)) {
          if (pageIds.includes(key)) {
            draft[key] = value;
          } else {
            value.forEach((action, index) => {
              const searchMatches =
                action.config.name
                  .toLowerCase()
                  .indexOf(searchKeyword.toLowerCase()) > -1;
              if (searchMatches) {
                draft[key][index] = action;
              } else {
                delete draft[key][index];
              }
            });
          }
          draft[key] = draft[key].filter(Boolean);
        }
      });
      log.debug("Filtered actions in:", performance.now() - start, "ms");
      return filteredActions;
    }
    return actions;
  }, [searchKeyword, actions]);
};

export const useWidgets = (searchKeyword?: string) => {
  const pageCanvasStructures = useSelector(
    (state: AppState) => state.ui.pageCanvasStructure,
  );
  const pageIds = usePageIds(searchKeyword);

  return useMemo(() => {
    if (searchKeyword && pageCanvasStructures) {
      const start = performance.now();
      const filteredDSLs = produce(pageCanvasStructures, (draft) => {
        for (const [key, value] of Object.entries(draft)) {
          if (pageIds.includes(key)) {
            draft[key] = value;
          } else {
            const filteredWidgets = findWidgets(
              value,
              searchKeyword.toLowerCase(),
            ) as WidgetProps;
            draft[key] = filteredWidgets;
          }
        }
      });
      log.debug("Filtered widgets in: ", performance.now() - start, "ms");
      return filteredDSLs;
    }
    return pageCanvasStructures;
  }, [searchKeyword, pageCanvasStructures]);
};

export const usePageIds = (searchKeyword?: string) => {
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });

  return useMemo(() => {
    if (searchKeyword) {
      const filteredPages = produce(pages, (draft) => {
        draft.forEach((page, index) => {
          const searchMatches =
            page.pageName.toLowerCase().indexOf(searchKeyword.toLowerCase()) >
            -1;
          if (searchMatches) {
          } else {
            delete draft[index];
          }
        });
      });

      return filteredPages.map((page) => page.pageId);
    }
    return pages.map((page) => page.pageId);
  }, [searchKeyword, pages]);
};

export const useFilteredEntities = (
  ref: MutableRefObject<HTMLInputElement | null>,
) => {
  const start = performance.now();
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);

  const search = debounce((e: any) => {
    const keyword = e.target.value;
    if (keyword.trim().length > 0) {
      setSearchKeyword(keyword);
    } else {
      setSearchKeyword(null);
    }
  }, 300);

  const event = new Event("cleared");
  useEffect(() => {
    const el: HTMLInputElement | null = ref.current;

    el?.addEventListener("keydown", search);
    el?.addEventListener("cleared", search);
    return () => {
      el?.removeEventListener("keydown", search);
      el?.removeEventListener("cleared", search);
    };
  }, [ref, search]);

  const clearSearch = useCallback(() => {
    const el: HTMLInputElement | null = ref.current;

    if (el && el.value.trim().length > 0) {
      el.value = "";
      el?.dispatchEvent(event);
    }
  }, [ref, event]);

  const stop = performance.now();
  log.debug("Explorer hook props calculations took", stop - start, "ms");
  return {
    searchKeyword: searchKeyword ?? undefined,
    clearSearch,
  };
};

export const useEntityUpdateState = (entityId: string) => {
  return useSelector(
    (state: AppState) =>
      get(state, "ui.explorer.entity.updatingEntity") === entityId,
  );
};

export const useEntityEditState = (entityId: string) => {
  return useSelector(
    (state: AppState) =>
      get(state, "ui.explorer.entity.editingEntityName") === entityId,
  );
};

export function useActiveAction() {
  const location = useLocation();
  const apiMatch = matchPath<{ apiId: string }>(location.pathname, {
    path: API_EDITOR_ID_PATH,
  });
  if (apiMatch?.params?.apiId) {
    return apiMatch.params.apiId;
  }
  const queryMatch = matchPath<{ queryId: string }>(window.location.pathname, {
    path: QUERIES_EDITOR_ID_PATH,
  });
  if (queryMatch?.params?.queryId) {
    return queryMatch.params.queryId;
  }
  const jsMatch = matchPath<{ collectionId: string }>(
    window.location.pathname,
    {
      path: JS_COLLECTION_ID_PATH,
    },
  );
  if (jsMatch?.params?.collectionId) {
    return jsMatch.params.collectionId;
  }
  const saasMatch = matchPath<{ apiId: string }>(window.location.pathname, {
    path: SAAS_EDITOR_API_ID_PATH,
  });
  if (saasMatch?.params?.apiId) {
    return saasMatch.params.apiId;
  }
}
