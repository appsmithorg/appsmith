import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { compact, get, groupBy } from "lodash";
import type { Datasource } from "entities/Datasource";
import { isStoredDatasource } from "entities/Action";
import type { WidgetProps } from "widgets/BaseWidget";
import log from "loglevel";
import { create } from "mutative";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { getActions, getDatasources } from "ee/selectors/entitiesSelector";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import { matchPath, useLocation } from "react-router";
import {
  API_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { basePathForActiveAction } from "ee/constants/routes/appRoutes";
import type { MODULE_TYPE } from "ee/constants/ModuleConstants";
import { MAX_DATASOURCE_SUGGESTIONS } from "constants/DatasourceEditorConstants";

export interface UseConvertToModulesOptionsProps {
  id: string;
  moduleType: MODULE_TYPE;
  canDelete: boolean;
}

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

export const useCurrentApplicationDatasource = () => {
  const actions = useSelector(getActions);
  const allDatasources = useSelector(getDatasources);
  const currentApplicationDatasource = useMemo(() => {
    const datasourceIdsUsedInCurrentApplication = actions.reduce(
      (acc, action: ActionData) => {
        if (
          isStoredDatasource(action.config.datasource) &&
          action.config.datasource.id
        ) {
          acc.add(action.config.datasource.id);
        }

        return acc;
      },
      new Set(),
    );

    return allDatasources.filter((ds) =>
      datasourceIdsUsedInCurrentApplication.has(ds.id),
    );
  }, [actions, allDatasources]);

  return currentApplicationDatasource;
};

export const useOtherDatasourcesInWorkspace = () => {
  const actions = useSelector(getActions);
  const allDatasources = useSelector(getDatasources);
  const otherDatasourcesInWorkspace = useMemo(() => {
    const datasourceIdsUsedInCurrentApplication = actions.reduce(
      (acc, action: ActionData) => {
        if (
          isStoredDatasource(action.config.datasource) &&
          action.config.datasource.id
        ) {
          acc.add(action.config.datasource.id);
        }

        return acc;
      },
      new Set(),
    );

    return allDatasources
      .filter(
        (ds) =>
          !datasourceIdsUsedInCurrentApplication.has(ds.id) &&
          ds.id !== TEMP_DATASOURCE_ID,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [actions, allDatasources]);

  return otherDatasourcesInWorkspace;
};

export const useAppWideAndOtherDatasource = () => {
  const datasourcesUsedInApplication = useCurrentApplicationDatasource();
  const otherDatasourceInWorkspace = useOtherDatasourcesInWorkspace();
  const appWideDS = useMemo(
    () =>
      [...datasourcesUsedInApplication].sort((ds1, ds2) =>
        ds1.name?.toLowerCase()?.localeCompare(ds2.name?.toLowerCase()),
      ),
    [datasourcesUsedInApplication],
  );
  const otherDS = useMemo(
    () =>
      [...otherDatasourceInWorkspace].sort((ds1, ds2) =>
        ds1.name?.toLowerCase()?.localeCompare(ds2.name?.toLowerCase()),
      ),
    [otherDatasourceInWorkspace],
  );

  return {
    appWideDS,
    otherDS,
  };
};

export const useDatasourceSuggestions = () => {
  const datasourcesUsedInApplication = useCurrentApplicationDatasource();
  const otherDatasourceInWorkspace = useOtherDatasourcesInWorkspace();

  if (datasourcesUsedInApplication.length >= MAX_DATASOURCE_SUGGESTIONS)
    return [];

  return otherDatasourceInWorkspace.slice(
    0,
    MAX_DATASOURCE_SUGGESTIONS - datasourcesUsedInApplication.length,
  );
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
      const filteredActions = create(actions, (draft) => {
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
  }, [searchKeyword, actions, pageIds]);
};

export const useWidgets = (searchKeyword?: string) => {
  const pageCanvasStructures = useSelector(
    (state: AppState) => state.ui.pageCanvasStructure,
  );
  const pageIds = usePageIds(searchKeyword);

  return useMemo(() => {
    if (searchKeyword && pageCanvasStructures) {
      const start = performance.now();
      const filteredDSLs = create(pageCanvasStructures, (draft) => {
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
  }, [searchKeyword, pageCanvasStructures, pageIds]);
};

export const usePageIds = (searchKeyword?: string) => {
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });

  return useMemo(() => {
    if (searchKeyword) {
      const filteredPages = create(pages, (draft) => {
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

export const useEntityUpdateState = (entityId: string) => {
  return useSelector((state: AppState) =>
    get(state, "ui.explorer.entity.updatingEntity")?.includes(entityId),
  );
};

export const useEntityEditState = (entityId: string) => {
  return useSelector(
    (state: AppState) =>
      get(state, "ui.explorer.entity.editingEntityName") === entityId,
  );
};

export function useActiveActionBaseId() {
  const location = useLocation();
  const path = basePathForActiveAction;

  const baseMatch = matchPath<{ baseApiId: string }>(location.pathname, {
    path,
    strict: false,
    exact: false,
  });

  const basePath = baseMatch?.path || "";

  const apiMatch = matchPath<{ baseApiId: string }>(location.pathname, {
    path: `${basePath}${API_EDITOR_ID_PATH}`,
  });

  if (apiMatch?.params?.baseApiId) {
    return apiMatch.params.baseApiId;
  }

  const queryMatch = matchPath<{ baseQueryId: string }>(location.pathname, {
    path: `${basePath}${QUERIES_EDITOR_ID_PATH}`,
  });

  if (queryMatch?.params?.baseQueryId) {
    return queryMatch.params.baseQueryId;
  }

  const jsMatch = matchPath<{ baseCollectionId: string }>(location.pathname, {
    path: `${basePath}${JS_COLLECTION_ID_PATH}`,
  });

  if (jsMatch?.params?.baseCollectionId) {
    return jsMatch.params.baseCollectionId;
  }

  const saasMatch = matchPath<{ baseApiId: string }>(location.pathname, {
    path: `${basePath}${SAAS_EDITOR_API_ID_PATH}`,
  });

  if (saasMatch?.params?.baseApiId) {
    return saasMatch.params.baseApiId;
  }
}

export const useCloseMenuOnScroll = (
  id: string,
  open: boolean,
  onClose: () => void,
) => {
  const scrollContainer = document.getElementById(id);

  useEffect(() => {
    if (open) {
      scrollContainer?.addEventListener("scroll", onClose, true);
    }

    return () => {
      scrollContainer?.removeEventListener("scroll", onClose);
    };
  }, [open]);
};

export const useConvertToModuleOptions = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: UseConvertToModulesOptionsProps,
) => {
  return undefined;
};
