import {
  useEffect,
  MutableRefObject,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { compact, groupBy } from "lodash";
import { Datasource } from "entities/Datasource";
import { isStoredDatasource } from "entities/Action";
import { debounce } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import log from "loglevel";
import produce from "immer";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";

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

export const useFilteredDatasources = (searchKeyword?: string) => {
  const reducerDatasources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });
  const actions = useActions();
  const pageIds = usePageIds(searchKeyword);

  const datasources = useMemo(() => {
    const datasourcesPageMap: Record<string, Datasource[]> = {};
    for (const [key, value] of Object.entries(actions)) {
      const datasourceIds = new Set();
      value.forEach((action) => {
        if (
          isStoredDatasource(action.config.datasource) &&
          action.config.datasource.id
        ) {
          datasourceIds.add(action.config.datasource.id);
        }
      });
      const activeDatasources = reducerDatasources.filter((datasource) =>
        datasourceIds.has(datasource.id),
      );
      datasourcesPageMap[key] = activeDatasources;
    }

    return datasourcesPageMap;
  }, [actions, reducerDatasources]);

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
    (state: AppState) => state.ui.explorer.updatingEntity === entityId,
  );
};

export const useEntityEditState = (entityId: string) => {
  return useSelector(
    (state: AppState) => state.ui.explorer.editingEntityName === entityId,
  );
};
