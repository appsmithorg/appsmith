import { AppState } from "reducers";
import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import { ActionResponse } from "api/ActionAPI";
import { createSelector } from "reselect";
import {
  Datasource,
  MockDatasource,
  DatasourceStructure,
} from "entities/Datasource";
import { Action, PluginType } from "entities/Action";
import { find } from "lodash";
import ImageAlt from "assets/images/placeholder-image.svg";
import { CanvasWidgetsReduxState } from "../reducers/entityReducers/canvasWidgetsReducer";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { AppStoreState } from "reducers/entityReducers/appReducer";
import { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { JSCollection } from "entities/JSCollection";
import { GenerateCRUDEnabledPluginMap } from "../api/PluginApi";
import { APP_MODE } from "entities/App";

export const getEntities = (state: AppState): AppState["entities"] =>
  state.entities;

export const getDatasources = (state: AppState): Datasource[] => {
  return state.entities.datasources.list;
};

export const getDatasourcesStructure = (
  state: AppState,
): Record<string, DatasourceStructure> => {
  return state.entities.datasources.structure;
};

export const getIsFetchingDatasourceStructure = (state: AppState): boolean => {
  return state.entities.datasources.fetchingDatasourceStructure;
};

export const getMockDatasources = (state: AppState): MockDatasource[] => {
  return state.entities.datasources.mockDatasourceList;
};

export const getIsDeletingDatasource = (state: AppState): boolean => {
  return state.entities.datasources.isDeleting;
};

export const getPluginIdsOfNames = (
  state: AppState,
  names: Array<string>,
): Array<string> | undefined => {
  const plugins = state.entities.plugins.list.filter((plugin) =>
    names.includes(plugin.name),
  );
  const pluginIds = plugins.map((plugin) => plugin.id);

  if (!pluginIds.length) return undefined;
  return pluginIds;
};

export const getPluginIdsOfPackageNames = (
  state: AppState,
  names: Array<string>,
): Array<string> | undefined => {
  const plugins = state.entities.plugins.list.filter((plugin) =>
    names.includes(plugin.packageName),
  );
  const pluginIds = plugins.map((plugin) => plugin.id);

  if (!pluginIds.length) return undefined;
  return pluginIds;
};

export const getPluginNameFromDatasourceId = (
  state: AppState,
  datasourceId: string,
): string | undefined => {
  const datasource = state.entities.datasources.list.find(
    (datasource) => datasource.id === datasourceId,
  );
  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === datasource?.pluginId,
  );

  if (!plugin) return undefined;
  return plugin.name;
};

export const getPluginPackageFromDatasourceId = (
  state: AppState,
  datasourceId: string,
): string | undefined => {
  const datasource = state.entities.datasources.list.find(
    (datasource) => datasource.id === datasourceId,
  );
  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === datasource?.pluginId,
  );

  if (!plugin) return undefined;
  return plugin.packageName;
};

export const getPluginNameFromId = (
  state: AppState,
  pluginId: string,
): string => {
  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === pluginId,
  );

  if (!plugin) return "";
  return plugin.name;
};

export const getPluginForm = (state: AppState, pluginId: string): any[] => {
  return state.entities.plugins.formConfigs[pluginId];
};
export const getIsFetchingSinglePluginForm = (
  state: AppState,
  pluginId: string,
): boolean => {
  return !!state.entities.plugins.fetchingSinglePluginForm[pluginId];
};

export const getIsExecutingDatasourceQuery = (state: AppState): boolean => {
  return state.entities.datasources.executingDatasourceQuery;
};

export const getEditorConfig = (state: AppState, pluginId: string): any[] => {
  return state.entities.plugins.editorConfigs[pluginId];
};

export const getSettingConfig = (state: AppState, pluginId: string): any[] => {
  return state.entities.plugins.settingConfigs[pluginId];
};

export const getActions = (state: AppState): ActionDataState =>
  state.entities.actions;

export const getJSCollections = (state: AppState): JSCollectionDataState =>
  state.entities.jsActions;

export const getDatasource = (
  state: AppState,
  datasourceId: string,
): Datasource | undefined =>
  state.entities.datasources.list.find(
    (datasource) => datasource.id === datasourceId,
  );

export const getDatasourceDraft = (state: AppState, id: string) => {
  const drafts = state.ui.datasourcePane.drafts;
  if (id in drafts) return drafts[id];
  return {};
};

export const getDatasourcesByPluginId = (
  state: AppState,
  id: string,
): Datasource[] => {
  return state.entities.datasources.list.filter((d) => d.pluginId === id);
};

export const getPlugins = (state: AppState) => state.entities.plugins.list;

export const getPluginByPackageName = (state: AppState, name: string) =>
  state.entities.plugins.list.find((p) => p.packageName === name);

export const getPluginEditorConfigs = (state: AppState) =>
  state.entities.plugins.editorConfigs;

export const getPluginDependencyConfig = (state: AppState) =>
  state.entities.plugins.dependencies;

export const getPluginSettingConfigs = (state: AppState, pluginId: string) =>
  state.entities.plugins.settingConfigs[pluginId];

export const getDBPlugins = createSelector(getPlugins, (plugins) =>
  plugins.filter((plugin) => plugin.type === PluginType.DB),
);

export const getDBAndRemotePlugins = createSelector(getPlugins, (plugins) =>
  plugins.filter(
    (plugin) =>
      plugin.type === PluginType.DB || plugin.type === PluginType.REMOTE,
  ),
);

export const getDatasourceByPluginId = (state: AppState, pluginId: string) =>
  state.entities.datasources.list.filter((d) => d.pluginId === pluginId);

export const getDBDatasources = createSelector(
  getDBPlugins,
  getEntities,
  (dbPlugins, entities) => {
    const datasources = entities.datasources.list;
    const dbPluginIds = dbPlugins.map((plugin) => plugin.id);

    return datasources.filter((datasource) =>
      dbPluginIds.includes(datasource.pluginId),
    );
  },
);

export const getDBAndRemoteDatasources = createSelector(
  getDBAndRemotePlugins,
  getEntities,
  (plugins, entities) => {
    const datasources = entities.datasources.list;
    const pluginIds = plugins.map((plugin) => plugin.id);

    return datasources.filter((datasource) =>
      pluginIds.includes(datasource.pluginId),
    );
  },
);

export const getQueryName = (state: AppState, actionId: string): string => {
  const action = state.entities.actions.find((action: ActionData) => {
    return action.config.id === actionId;
  });

  return action?.config.name ?? "";
};

const getCurrentPageId = (state: AppState) =>
  state.entities.pageList.currentPageId;

export const getDatasourcePlugins = createSelector(getPlugins, (plugins) => {
  return plugins.filter((plugin) => plugin?.allowUserDatasources ?? true);
});

export const getPluginImages = createSelector(getPlugins, (plugins) => {
  const pluginImages: Record<string, string> = {};

  plugins.forEach((plugin) => {
    pluginImages[plugin.id] = plugin?.iconLocation ?? ImageAlt;
  });

  return pluginImages;
});

export const getPluginTemplates = createSelector(getPlugins, (plugins) => {
  const pluginTemplates: Record<string, any> = {};

  plugins.forEach((plugin) => {
    pluginTemplates[plugin.id] = plugin.templates;
  });

  return pluginTemplates;
});

export const getPluginResponseTypes = createSelector(getPlugins, (plugins) => {
  const pluginResponseTypes: Record<string, any> = {};

  plugins.forEach((plugin) => {
    pluginResponseTypes[plugin.id] = plugin.responseType;
  });

  return pluginResponseTypes;
});

export const getPluginDocumentationLinks = createSelector(
  getPlugins,
  (plugins) => {
    const pluginDocumentationLinks: Record<string, string | undefined> = {};

    plugins.forEach((plugin) => {
      pluginDocumentationLinks[plugin.id] = plugin.documentationLink;
    });

    return pluginDocumentationLinks;
  },
);

export const getGenerateCRUDEnabledPluginMap = createSelector(
  getPlugins,
  (plugins) => {
    const pluginIdGenerateCRUDPageEnabled: GenerateCRUDEnabledPluginMap = {};
    plugins.map((plugin) => {
      if (plugin.generateCRUDPageComponent) {
        pluginIdGenerateCRUDPageEnabled[plugin.id] = plugin.packageName;
      }
    });
    return pluginIdGenerateCRUDPageEnabled;
  },
);

export const getActionsForCurrentPage = createSelector(
  getCurrentPageId,
  getActions,
  (pageId, actions) => {
    if (!pageId) return [];
    return actions.filter((a) => a.config.pageId === pageId);
  },
);

export const getJSCollectionsForCurrentPage = createSelector(
  getCurrentPageId,
  getJSCollections,
  (pageId, actions) => {
    if (!pageId) return [];
    return actions.filter((a) => a.config.pageId === pageId);
  },
);

export const getQueryActionsForCurrentPage = createSelector(
  getActionsForCurrentPage,
  (actions) => {
    return actions.filter((action) => {
      return action.config.pluginType === PluginType.DB;
    });
  },
);

export const getPlugin = (state: AppState, pluginId: string) => {
  return state.entities.plugins.list.find((plugin) => plugin.id === pluginId);
};

export const getActionResponses = createSelector(getActions, (actions) => {
  const responses: Record<string, ActionResponse | undefined> = {};

  actions.forEach((a) => {
    responses[a.config.id] = a.data;
  });
  return responses;
});

export const getAction = (
  state: AppState,
  actionId: string,
): Action | undefined => {
  const action = find(state.entities.actions, (a) => a.config.id === actionId);
  return action ? action.config : undefined;
};

export const getJSCollection = (
  state: AppState,
  actionId: string,
): JSCollection | undefined => {
  const jsaction = find(
    state.entities.jsActions,
    (a) => a.config.id === actionId,
  );
  return jsaction ? jsaction.config : undefined;
};

export function getCurrentPageNameByActionId(
  state: AppState,
  actionId: string,
): string {
  const action = state.entities.actions.find((action) => {
    return action.config.id === actionId;
  });
  const pageId = action ? action.config.pageId : "";
  return getPageNameByPageId(state, pageId);
}

export function getCurrentPageNameByJSCollectionId(
  state: AppState,
  actionId: string,
): string {
  const action = state.entities.jsActions.find((action) => {
    return action.config.id === actionId;
  });
  const pageId = action ? action.config.pageId : "";
  return getPageNameByPageId(state, pageId);
}

export function getPageNameByPageId(state: AppState, pageId: string): string {
  const page = state.entities.pageList.pages.find(
    (page) => page.pageId === pageId,
  );
  return page ? page.pageName : "";
}

const getQueryPaneSavingMap = (state: AppState) => state.ui.queryPane.isSaving;
const getApiPaneSavingMap = (state: AppState) => state.ui.apiPane.isSaving;
const getActionDirtyState = (state: AppState) => state.ui.apiPane.isDirty;

export const isActionSaving = (id: string) =>
  createSelector(
    [getQueryPaneSavingMap, getApiPaneSavingMap],
    (querySavingMap, apiSavingsMap) => {
      return (
        (id in querySavingMap && querySavingMap[id]) ||
        (id in apiSavingsMap && apiSavingsMap[id])
      );
    },
  );

export const isActionDirty = (id: string) =>
  createSelector([getActionDirtyState], (actionDirtyMap) => {
    return id in actionDirtyMap && actionDirtyMap[id];
  });

export const getAppData = (state: AppState) => state.entities.app;

export const getAppStoreData = (state: AppState): AppStoreState =>
  state.entities.app.store;

export const getCanvasWidgets = (state: AppState): CanvasWidgetsReduxState =>
  state.entities.canvasWidgets;

const getPageWidgets = (state: AppState) => state.ui.pageWidgets;
export const getCurrentPageWidgets = createSelector(
  getPageWidgets,
  getCurrentPageId,
  (widgetsByPage, currentPageId) =>
    currentPageId ? widgetsByPage[currentPageId] : {},
);

const getParentModalId = (widget: any, pageWidgets: Record<string, any>) => {
  let parentModalId;
  let { parentId } = widget;
  let parentWidget = pageWidgets[parentId];
  while (parentId && parentId !== MAIN_CONTAINER_WIDGET_ID) {
    if (parentWidget?.type === "MODAL_WIDGET") {
      parentModalId = parentId;
      break;
    }
    parentId = parentWidget?.parentId;
    parentWidget = pageWidgets[parentId];
  }
  return parentModalId;
};

export const getCanvasWidgetsWithParentId = createSelector(
  getCanvasWidgets,
  (canvasWidgets: CanvasWidgetsReduxState) => {
    return Object.entries(canvasWidgets).reduce(
      (res, [widgetId, widget]: any) => {
        const parentModalId = getParentModalId(widget, canvasWidgets);

        return {
          ...res,
          [widgetId]: { ...widget, parentModalId },
        };
      },
      {},
    );
  },
);

export const getAllWidgetsMap = createSelector(
  getPageWidgets,
  (widgetsByPage) => {
    return Object.entries(widgetsByPage).reduce(
      (res: any, [pageId, pageWidgets]: any) => {
        const widgetsMap = Object.entries(pageWidgets).reduce(
          (res, [widgetId, widget]: any) => {
            const parentModalId = getParentModalId(widget, pageWidgets);

            return {
              ...res,
              [widgetId]: { ...widget, pageId, parentModalId },
            };
          },
          {},
        );

        return {
          ...res,
          ...widgetsMap,
        };
      },
      {},
    );
  },
);

export const getAllPageWidgets = createSelector(
  getAllWidgetsMap,
  (widgetsMap) => {
    return Object.entries(widgetsMap).reduce(
      (res: any[], [, widget]: any) => [...res, widget],
      [],
    );
  },
);

export const getPageListAsOptions = createSelector(
  (state: AppState) => state.entities.pageList.pages,
  (pages) =>
    pages.map((page) => ({
      label: page.pageName,
      id: page.pageId,
      value: `'${page.pageName}'`,
    })),
);

export const getExistingPageNames = createSelector(
  (state: AppState) => state.entities.pageList.pages,
  (pages) => pages.map((page) => page.pageName),
);

export const getExistingWidgetNames = createSelector(
  (state: AppState) => state.entities.canvasWidgets,
  (widgets) => Object.values(widgets).map((widget) => widget.pageName),
);

export const getExistingActionNames = createSelector(
  (state: AppState) => state.entities.actions,
  (actions) =>
    actions.map((action: { config: { name: string } }) => action.config.name),
);

export const getAppMode = (state: AppState) => state.entities.app.mode;

export const widgetsMapWithParentModalId = (state: AppState) => {
  const appMode = getAppMode(state);
  return appMode === APP_MODE.EDIT
    ? getAllWidgetsMap(state)
    : getCanvasWidgetsWithParentId(state);
};

export const getIsOnboardingTasksView = createSelector(
  getCanvasWidgets,
  (widgets) => {
    return Object.keys(widgets).length == 1;
  },
);

export const getIsOnboardingWidgetSelection = (state: AppState) =>
  state.ui.onBoarding.inOnboardingWidgetSelection;

export const getPageActions = (pageId = "") => {
  return (state: AppState) => {
    return state.entities.actions.filter((action) => {
      return action.config.pageId == pageId;
    });
  };
};
