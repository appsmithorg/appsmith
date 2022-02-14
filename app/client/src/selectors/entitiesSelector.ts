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
  isEmbeddedRestDatasource,
} from "entities/Datasource";
import { Action, PluginType } from "entities/Action";
import { find, sortBy } from "lodash";
import ImageAlt from "assets/images/placeholder-image.svg";
import { CanvasWidgetsReduxState } from "../reducers/entityReducers/canvasWidgetsReducer";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { AppStoreState } from "reducers/entityReducers/appReducer";
import { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { JSCollection } from "entities/JSCollection";
import { GenerateCRUDEnabledPluginMap } from "../api/PluginApi";
import { APP_MODE } from "entities/App";
import getFeatureFlags from "utils/featureFlags";
import { ExplorerFileEntity } from "pages/Editor/Explorer/helpers";
import { ActionValidationConfigMap } from "constants/PropertyControlConstants";

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

export const getPluginTypeFromDatasourceId = (
  state: AppState,
  datasourceId: string,
): PluginType | undefined => {
  const datasource = state.entities.datasources.list.find(
    (datasource) => datasource.id === datasourceId,
  );
  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === datasource?.pluginId,
  );

  if (!plugin) return undefined;
  return plugin.type;
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

export const getPageList = createSelector(
  (state: AppState) => state.entities.pageList.pages,
  (pages) => pages,
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
  (widgets) => Object.values(widgets).map((widget) => widget.widgetName),
);

export const getExistingActionNames = createSelector(
  (state: AppState) => state.entities.actions,
  getCurrentPageId,
  // editingEntityName is actually an id and not a name per say and it points to the id of an action being edited through the explorer.
  (state: AppState) => state.ui.explorer.entity.editingEntityName,
  (actions, currentPageId, editingEntityId) => {
    // get the current action being edited
    const editingAction =
      editingEntityId &&
      actions.filter(
        (action: { config: { id: string } }) =>
          action.config.id === editingEntityId,
      );

    // if the current action being edited is on the same page, filter the actions on the page and return their names.
    // or if the there is no current action being edited (this happens when a widget, or any other entity is being edited), return the actions on the page.
    if (
      (editingAction &&
        editingAction.length > 0 &&
        editingAction[0].config.pageId === currentPageId) ||
      (editingAction && editingAction.length < 1)
    ) {
      return actions.map(
        (actionItem: { config: { name: string; pageId: string } }) => {
          if (actionItem.config.pageId === currentPageId) {
            return actionItem.config.name;
          }
          return undefined;
        },
      );
    } else {
      // if current action being edited is on another page, filter the actions not on the page and return their names.
      return actions.map(
        (actionItem: { config: { name: string; pageId: string } }) => {
          if (actionItem.config.pageId !== currentPageId) {
            return actionItem.config.name;
          }
          return undefined;
        },
      );
    }
  },
);

export const getExistingJSCollectionNames = createSelector(
  getJSCollections,
  (jsActions) =>
    jsActions.map((action: { config: { name: string } }) => action.config.name),
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

export const selectDatasourceIdToNameMap = createSelector(
  getDatasources,
  (datasources) => {
    return datasources.reduce((acc, datasource) => {
      acc[datasource.id] = datasource.name;
      return acc;
    }, {} as Record<string, string>);
  },
);

export const selectWidgetsForCurrentPage = createSelector(
  (state: AppState) => state.ui.pageCanvasStructure,
  getCurrentPageId,
  (canvasStructure, pageId) => (pageId ? canvasStructure[pageId] : null),
);

export const selectAllPages = (state: AppState) => {
  return state.entities.pageList.pages;
};

export const selectFilesForExplorer = createSelector(
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
  selectDatasourceIdToNameMap,
  (actions, jsActions, datasourceIdToNameMap) => {
    const isJSEditorEnabled = getFeatureFlags().JS_EDITOR;
    const files = [...actions, ...(isJSEditorEnabled ? jsActions : [])].reduce(
      (acc, file) => {
        let group = "";
        if (file.config.pluginType === PluginType.JS) {
          group = "JS Objects";
        } else if (file.config.pluginType === PluginType.API) {
          group = isEmbeddedRestDatasource(file.config.datasource)
            ? "APIs"
            : datasourceIdToNameMap[file.config.datasource.id] ?? "APIs";
        } else {
          group = datasourceIdToNameMap[file.config.datasource.id];
        }
        acc = acc.concat({
          type: file.config.pluginType,
          entity: file,
          group,
        });
        return acc;
      },
      [] as Array<ExplorerFileEntity>,
    );

    const filesSortedByGroupName = sortBy(files, [
      (file) => file.group?.toLowerCase(),
      (file) => file.entity.config?.name?.toLowerCase(),
    ]);
    const groupedFiles = filesSortedByGroupName.reduce(
      (acc, file) => {
        if (acc.group !== file.group) {
          acc.files = acc.files.concat({
            type: "group",
            entity: {
              name: file.group,
            },
          });
          acc.group = file.group;
        }
        acc.files = acc.files.concat({
          ...file,
          entity: { id: file.entity.config.id, name: file.entity.config.name },
        });
        return acc;
      },
      {
        group: "" as any,
        files: [] as any,
      },
    );
    return groupedFiles.files;
  },
);

export const getActionValidationConfig = (state: AppState, action: any) => {
  const pluginId = action.pluginId;
  return getActionValidationConfigFromPlugin(
    state.entities.plugins.editorConfigs[pluginId],
    {},
  );
};

export const getAllActionValidationConfig = (state: AppState) => {
  const allActions = state.entities.actions;
  const allValidationConfigs: {
    [actionId: string]: ActionValidationConfigMap;
  } = {};
  for (let i = 0; i < allActions.length; i++) {
    const pluginId = allActions[i].config.pluginId;
    let validationConfigs: ActionValidationConfigMap = {};
    validationConfigs = getActionValidationConfigFromPlugin(
      state.entities.plugins.editorConfigs[pluginId],
      {},
    );
    allValidationConfigs[allActions[i].config.id] = validationConfigs;
  }
  return allValidationConfigs;
};

function getActionValidationConfigFromPlugin(
  editorConfig: any,
  validationConfig: ActionValidationConfigMap,
): ActionValidationConfigMap {
  let newValidationConfig: ActionValidationConfigMap = {
    ...validationConfig,
  };
  if (!editorConfig || !editorConfig.length) return {};
  for (let i = 0; i < editorConfig.length; i++) {
    if (editorConfig[i].validationConfig) {
      const configProperty = editorConfig[i].configProperty;
      newValidationConfig[configProperty] = editorConfig[i].validationConfig;
    }

    if (editorConfig[i].children) {
      const childrenValidationConfig = getActionValidationConfigFromPlugin(
        editorConfig[i].children,
        validationConfig,
      );
      newValidationConfig = Object.assign(
        newValidationConfig,
        childrenValidationConfig,
      );
    }
  }
  return newValidationConfig;
}
