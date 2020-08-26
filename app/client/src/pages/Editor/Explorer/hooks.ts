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
import { Datasource } from "api/DatasourcesApi";
import { debounce } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import log from "loglevel";
import produce from "immer";

const findWidgets = (widgets: WidgetProps, keyword: string) => {
  if (!widgets || !widgets.widgetName) return widgets;
  const widgetNameMached =
    widgets.widgetName.toLowerCase().indexOf(keyword) > -1;
  if (widgets.children) {
    widgets.children = compact(
      widgets.children.map((widget: WidgetProps) =>
        findWidgets(widget, keyword),
      ),
    );
  }
  if (widgetNameMached || widgets.children?.length > 0) return widgets;
};

const findDataSources = (dataSources: Datasource[], keyword: string) => {
  return dataSources.filter(
    (dataSource: Datasource) =>
      dataSource.name.toLowerCase().indexOf(keyword) > -1,
  );
};

export const useFilteredDatasources = (searchKeyword?: string) => {
  const dataSources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });

  return useMemo(
    () =>
      searchKeyword
        ? findDataSources(dataSources, searchKeyword.toLowerCase())
        : dataSources,
    [searchKeyword, dataSources],
  );
};

export const useActions = (searchKeyword?: string) => {
  const reducerActions = useSelector(
    (state: AppState) => state.entities.actions,
  );

  const actions = useMemo(() => {
    return groupBy(reducerActions, "config.pageId");
  }, [reducerActions]);

  return useMemo(() => {
    if (searchKeyword) {
      const start = performance.now();
      const filteredActions = produce(actions, draft => {
        for (const [key, value] of Object.entries(draft)) {
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
  const pageDSLs = useSelector((state: AppState) => state.ui.pageDSLs);
  return useMemo(() => {
    if (searchKeyword && pageDSLs) {
      const start = performance.now();
      const filteredDSLs = produce(pageDSLs, draft => {
        for (const [key, value] of Object.entries(draft)) {
          const filteredWidgets = findWidgets(
            value,
            searchKeyword.toLowerCase(),
          ) as WidgetProps;
          draft[key] = filteredWidgets;
        }
      });
      log.debug("Filtered widgets in: ", performance.now() - start, "ms");
      return filteredDSLs;
    }
    return pageDSLs;
  }, [searchKeyword, pageDSLs]);
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
