import { AppState } from "reducers";
import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import { ActionResponse } from "api/ActionAPI";
import { QUERY_CONSTANT } from "constants/QueryEditorConstants";
import { createSelector } from "reselect";
import { Datasource } from "entities/Datasource";
import { Action } from "entities/Action";
import { find } from "lodash";
import ImageAlt from "assets/images/placeholder-image.svg";
import { CanvasWidgetsReduxState } from "../reducers/entityReducers/canvasWidgetsReducer";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

export const getEntities = (state: AppState): AppState["entities"] =>
  state.entities;

export const getDatasources = (state: AppState): Datasource[] => {
  return state.entities.datasources.list;
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

export const getPluginPackageFromId = (state: AppState, pluginId: string) => {
  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === pluginId,
  );

  if (!plugin) return "";
  return plugin.packageName;
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

export const getPluginNameFromId = (state: AppState, pluginId: string) => {
  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === pluginId,
  );

  if (!plugin) return "";
  return plugin.name;
};

export const getPluginForm = (state: AppState, pluginId: string): any[] => {
  return state.entities.plugins.formConfigs[pluginId];
};

export const getEditorConfig = (state: AppState, pluginId: string): any[] => {
  return state.entities.plugins.editorConfigs[pluginId];
};

export const getSettingConfig = (state: AppState, pluginId: string): any[] => {
  return state.entities.plugins.settingConfigs[pluginId];
};

export const getActions = (state: AppState): ActionDataState =>
  state.entities.actions;

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

export const getPlugins = (state: AppState) => state.entities.plugins.list;
export const getPluginEditorConfigs = (state: AppState) =>
  state.entities.plugins.editorConfigs;

export const getDBPlugins = createSelector(getPlugins, (plugins) =>
  plugins.filter((plugin) => plugin.type === QUERY_CONSTANT),
);

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

export const getActionsForCurrentPage = createSelector(
  getCurrentPageId,
  getActions,
  (pageId, actions) => {
    if (!pageId) return [];
    return actions.filter((a) => a.config.pageId === pageId);
  },
);

export const getQueryActionsForCurrentPage = createSelector(
  getActionsForCurrentPage,
  (actions) => {
    return actions.filter((action) => {
      return action.config.pluginType === QUERY_CONSTANT;
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

export const getCanvasWidgets = (state: AppState): CanvasWidgetsReduxState =>
  state.entities.canvasWidgets;

const getPageWidgets = (state: AppState) => state.ui.pageWidgets;

export const getAllWidgetsMap = createSelector(
  getPageWidgets,
  (widgetsByPage) => {
    return Object.entries(widgetsByPage).reduce(
      (res: any, [pageId, pageWidgets]: any) => {
        const widgetsMap = Object.entries(pageWidgets).reduce(
          (res, [widgetId, widget]: any) => {
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
