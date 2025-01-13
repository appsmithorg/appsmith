import type { AppState } from "ee/reducers";
import type {
  ActionData,
  ActionDataState,
} from "ee/reducers/entityReducers/actionsReducer";
import type { ActionResponse } from "api/ActionAPI";
import { createSelector } from "reselect";
import type {
  Datasource,
  DatasourceStructure,
  MockDatasource,
} from "entities/Datasource";
import {
  isEmbeddedAIDataSource,
  isEmbeddedRestDatasource,
} from "entities/Datasource";
import type { Action } from "entities/Action";
import {
  isStoredDatasource,
  PluginPackageName,
  PluginType,
} from "entities/Action";
import { countBy, find, get, groupBy, keyBy, sortBy } from "lodash";
import ImageAlt from "assets/images/placeholder-image.svg";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  MAIN_CONTAINER_WIDGET_ID,
  MAIN_CONTAINER_WIDGET_NAME,
} from "constants/WidgetConstants";
import type { AppStoreState } from "reducers/entityReducers/appReducer";
import type {
  JSCollectionData,
  JSCollectionDataState,
} from "ee/reducers/entityReducers/jsActionsReducer";
import type {
  DefaultPlugin,
  GenerateCRUDEnabledPluginMap,
  Plugin,
} from "api/PluginApi";
import type { JSAction, JSCollection } from "entities/JSCollection";
import { APP_MODE } from "entities/App";
import type { ExplorerFileEntity } from "ee/pages/Editor/Explorer/helpers";
import type { ActionValidationConfigMap } from "constants/PropertyControlConstants";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import {
  EVAL_ERROR_PATH,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";

import { InstallState } from "reducers/uiReducers/libraryReducer";
import recommendedLibraries from "pages/Editor/Explorer/Libraries/recommendedLibraries";
import type { JSLibrary } from "workers/common/JSLibrary";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import { getFormValues } from "redux-form";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import type { Module } from "ee/constants/ModuleConstants";
// import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import {
  getCurrentWorkflowActions,
  getCurrentWorkflowJSActions,
} from "ee/selectors/workflowSelectors";
import { MAX_DATASOURCE_SUGGESTIONS } from "constants/DatasourceEditorConstants";
import type { CreateNewActionKeyInterface } from "ee/entities/Engine/actionHelpers";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  EditorEntityTab,
  type EntityItem,
  type GenericEntityItem,
} from "ee/entities/IDE/constants";
import {
  ActionUrlIcon,
  JsFileIconV2,
  WidgetIconByType,
} from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import {
  getIsSavingForApiName,
  getIsSavingForJSObjectName,
} from "selectors/ui";

export enum GROUP_TYPES {
  API = "APIs",
  JS_ACTIONS = "JS Objects",
  AI = "AI Queries",
  WORKFLOWS = "Workflows",
  PACKAGES = "Packages",
}

export const getEntities = (state: AppState): AppState["entities"] =>
  state.entities;

export const getDatasources = (state: AppState): Datasource[] => {
  return state.entities.datasources.list;
};

export const getPlugins = (state: AppState) => state.entities.plugins.list;

export enum PluginCategory {
  SAAS = "SaaS integrations",
  AI = "AI integrations",
  Databases = "Databases",
  APIs = "APIs",
  Others = "Others",
}

export interface NewEntityNameOptions {
  prefix: string;
  parentEntityId: string;
  parentEntityKey: CreateNewActionKeyInterface;
  suffix?: string;
  startWithoutIndex?: boolean;
}

export type DatasourceGroupByPluginCategory = Record<
  PluginCategory,
  Datasource[]
>;

export const getDatasourcesGroupedByPluginCategory = createSelector(
  getDatasources,
  getPlugins,
  (datasources, plugins): DatasourceGroupByPluginCategory => {
    const groupedPlugins = keyBy(plugins, "id");

    return <DatasourceGroupByPluginCategory>groupBy(datasources, (d) => {
      const plugin = groupedPlugins[d.pluginId];

      if (
        plugin.type === PluginType.SAAS ||
        plugin.type === PluginType.REMOTE ||
        plugin.type === PluginType.EXTERNAL_SAAS
      ) {
        return PluginCategory.SAAS;
      }

      if (plugin.type === PluginType.AI) return PluginCategory.AI;

      if (plugin.type === PluginType.DB) return PluginCategory.Databases;

      if (plugin.type === PluginType.API) return PluginCategory.APIs;

      return PluginCategory.Others;
    });
  },
);

// Returns non temp datasources
export const getSavedDatasources = (state: AppState): Datasource[] => {
  return state.entities.datasources.list.filter(
    (datasource) => datasource.id !== TEMP_DATASOURCE_ID,
  );
};

export const getRecentDatasourceIds = (state: AppState): string[] => {
  return state.entities.datasources.recentDatasources;
};

export const getDatasourcesStructure = (
  state: AppState,
): Record<string, DatasourceStructure> => {
  return state.entities.datasources.structure;
};

export const getDatasourceStructureById = (
  state: AppState,
  id: string,
): DatasourceStructure => {
  return state.entities.datasources.structure[id];
};

// ! git mod - the following function is not getting used
/**
 * Selector to indicate if the widget name should be shown/drawn on canvas
 */
// export const getShouldShowWidgetName = createSelector(
//   (state: AppState) => state.ui.widgetDragResize.isResizing,
//   (state: AppState) => state.ui.widgetDragResize.isDragging,
//   (state: AppState) => state.ui.editor.isPreviewMode,
//   (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
//   getAnvilSpaceDistributionStatus,
//   // cannot import other selectors, breaks the app
//   (state) => {
//     const gitMetaData =
//       state.ui.applications.currentApplication?.gitApplicationMetadata;
//     const isGitConnected = !!(gitMetaData && gitMetaData?.remoteUrl);
//     const currentBranch = gitMetaData?.branchName;
//     const { protectedBranches = [] } = state.ui.gitSync;

//     if (!isGitConnected || !currentBranch) {
//       return false;
//     } else {
//       return protectedBranches.includes(currentBranch);
//     }
//   },
//   (
//     isResizing,
//     isDragging,
//     isPreviewMode,
//     isAutoCanvasResizing,
//     isDistributingSpace,
//     isProtectedMode,
//   ) => {
//     return (
//       !isResizing &&
//       !isDragging &&
//       !isPreviewMode &&
//       !isAutoCanvasResizing &&
//       !isDistributingSpace &&
//       !isProtectedMode
//     );
//   },
// );

export const getDatasourceTableColumns =
  (datasourceId: string, tableName: string) => (state: AppState) => {
    const structure = getDatasourceStructureById(state, datasourceId);

    if (structure) {
      const table = structure.tables?.find((d) => d.name === tableName);

      return table?.columns;
    }
  };
export const getDatasourceTablePrimaryColumn =
  (datasourceId: string, tableName: string) => (state: AppState) => {
    const structure = getDatasourceStructureById(state, datasourceId);

    if (structure) {
      const table = structure.tables?.find((d) => d.name === tableName);

      if (table) {
        const primaryKey = table.keys?.find((d) => d.type === "primary key");

        return primaryKey?.columnNames?.[0];
      }
    }
  };

export const getDatasourceFirstTableName = (
  state: AppState,
  datasourceId: string,
) => {
  if (!datasourceId) {
    return "";
  }

  const structure = getDatasourceStructureById(state, datasourceId);

  if (structure) {
    if (!!structure.tables && structure.tables.length > 0) {
      return structure.tables[0].name;
    }
  }

  return "";
};

export const getIsFetchingDatasourceStructure = (
  state: AppState,
  datasourceId: string,
): boolean => {
  return state.entities.datasources.fetchingDatasourceStructure[datasourceId];
};

export const getMockDatasources = (state: AppState): MockDatasource[] => {
  return state.entities.datasources.mockDatasourceList;
};

export const getDefaultPlugins = (state: AppState): DefaultPlugin[] =>
  state.entities.plugins.defaultPluginList;

// Get plugin by id or package name
export const getDefaultPlugin = (
  state: AppState,
  pluginIdentifier: string,
): DefaultPlugin | undefined => {
  return state.entities.plugins.defaultPluginList.find(
    (plugin) =>
      plugin.packageName === pluginIdentifier || plugin.id === pluginIdentifier,
  );
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

export const getPluginIdFromDatasourceId = (
  state: AppState,
  datasourceId: string,
): string | undefined => {
  const datasource = state.entities.datasources.list.find(
    (datasource) => datasource.id === datasourceId,
  );

  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === datasource?.pluginId,
  );

  return plugin?.id;
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

export const getPluginPackageNameFromId = (
  state: AppState,
  pluginId: string,
): string => {
  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === pluginId,
  );

  if (!plugin) return "";

  return plugin.packageName;
};

export const getPluginDatasourceComponentFromId = (
  state: AppState,
  pluginId: string,
): string => {
  const plugin = state.entities.plugins.list.find(
    (plugin) => plugin.id === pluginId,
  );

  if (!plugin) return "";

  return plugin.datasourceComponent;
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const getIsDatasourceTesting = (state: AppState): boolean => {
  return state.entities.datasources.isTesting;
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getEditorConfig = (state: AppState, pluginId: string): any[] => {
  return state.entities.plugins.editorConfigs[pluginId];
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSettingConfig = (state: AppState, pluginId: string): any[] => {
  return state.entities.plugins.settingConfigs[pluginId];
};

export const getDatasourceFormButtonConfig = (
  state: AppState,
  pluginId: string,
): string[] => {
  return state.entities.plugins.datasourceFormButtonConfigs[pluginId];
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

export const getDatasourceDrafts = (state: AppState) => {
  return state.ui.datasourcePane.drafts;
};

export const getDatasourceDraft = (state: AppState, id: string) => {
  const drafts = state.ui.datasourcePane.drafts;

  if (id in drafts) return drafts[id];

  return {};
};

export const getDatasourceActionRouteInfo = (state: AppState) => {
  return state.ui.datasourcePane.actionRouteInfo;
};

export const getDatasourcesByPluginId = (
  state: AppState,
  id: string,
): Datasource[] => {
  return state.entities.datasources.list.filter((d) => d.pluginId === id);
};

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

// Most popular datasources are hardcoded right now to include these 4 plugins and REST API
// Going forward we may want to have separate list for each instance based on usage
export const getMostPopularPlugins = createSelector(getPlugins, (plugins) => {
  const popularPlugins: Plugin[] = [];

  const gsheetPlugin = plugins.find(
    (plugin) => plugin.packageName === PluginPackageName.GOOGLE_SHEETS,
  );
  const restPlugin = plugins.find(
    (plugin) => plugin.packageName === PluginPackageName.REST_API,
  );
  const postgresPlugin = plugins.find(
    (plugin) => plugin.packageName === PluginPackageName.POSTGRES,
  );
  const mysqlPlugin = plugins.find(
    (plugin) => plugin.packageName === PluginPackageName.MY_SQL,
  );
  const mongoPlugin = plugins.find(
    (plugin) => plugin.packageName === PluginPackageName.MONGO,
  );

  gsheetPlugin && popularPlugins.push(gsheetPlugin);
  restPlugin && popularPlugins.push(restPlugin);
  postgresPlugin && popularPlugins.push(postgresPlugin);
  mysqlPlugin && popularPlugins.push(mysqlPlugin);
  mongoPlugin && popularPlugins.push(mongoPlugin);

  return popularPlugins;
});

export const getDBAndRemotePlugins = createSelector(getPlugins, (plugins) =>
  plugins.filter(
    (plugin) =>
      plugin.type === PluginType.DB ||
      plugin.type === PluginType.REMOTE ||
      plugin.type === PluginType.AI,
  ),
);

export const getUnconfiguredDatasources = (state: AppState) =>
  state.entities.datasources.unconfiguredList ?? [];

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

// * This is only for internal use to avoid cyclic dependency issue
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

export const getPluginNames = createSelector(getPlugins, (plugins) => {
  const pluginNames: Record<string, string> = {};

  plugins.forEach((plugin) => {
    pluginNames[plugin.id] = plugin?.name;
  });

  return pluginNames;
});

export const getPluginTemplates = createSelector(getPlugins, (plugins) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginTemplates: Record<string, any> = {};

  plugins.forEach((plugin) => {
    pluginTemplates[plugin.id] = plugin.templates;
  });

  return pluginTemplates;
});

export const getPluginResponseTypes = createSelector(getPlugins, (plugins) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const getPluginIdPackageNamesMap = createSelector(
  getPlugins,
  (plugins) => {
    return plugins.reduce((obj: Record<string, string>, plugin) => {
      obj[plugin.id] = plugin.packageName;

      return obj;
    }, {});
  },
);

export const getCurrentActions = createSelector(
  getCurrentPageId,
  getActions,
  (pageId, actions): ActionData[] => {
    if (!pageId) return [];

    return actions.filter((a) => a.config.pageId === pageId);
  },
);

export const getCanvasWidgets = (state: AppState): CanvasWidgetsReduxState =>
  state.entities.canvasWidgets;

export const actionsExistInCurrentPage = createSelector(
  getCurrentActions,
  (actions) => {
    return !!actions.length;
  },
);

export const widgetsExistCurrentPage = createSelector(
  getCanvasWidgets,
  (widgets) => {
    return Object.keys(widgets).length > 1;
  },
);

// Note: getCurrentJSCollections (returns a new object everytime)
export const getCurrentJSCollections = createSelector(
  getCurrentPageId,
  getJSCollections,
  (pageId, actions) => {
    if (!pageId) return [];

    return actions.filter((a) => a.config.pageId === pageId);
  },
);

export const getCurrentModuleActions = () => [];

export const getCurrentModuleJSCollections = () => [];

export const getJSCollectionFromName = createSelector(
  [
    getCurrentJSCollections,
    (_state: AppState, JSObjectName: string) => JSObjectName,
  ],
  (jsCollections, JSObjectName) => {
    let currentJSCollection = null;

    for (const jsCollection of jsCollections) {
      if (JSObjectName === jsCollection.config.name) {
        currentJSCollection = jsCollection;
        break;
      }
    }

    return currentJSCollection;
  },
);
export const getJSActionFromName = createSelector(
  [
    (state: AppState, jsCollectionName: string) =>
      getJSCollectionFromName(state, jsCollectionName),
    (_state: AppState, jsCollectionName: string, functionName: string) => ({
      jsCollectionName,
      functionName,
    }),
  ],
  (JSCollectionData, { functionName }) => {
    if (!JSCollectionData) return null;

    const jsFunction = find(
      JSCollectionData.config.actions,
      (action) => action.name === functionName,
    );

    return jsFunction || null;
  },
);

export const getJSActionFromJSCollection = (
  JSCollection: JSCollectionData,
  functionName: string,
) => {
  const actions = JSCollection.config.actions;
  let currentAction = null;

  for (const jsAction of actions) {
    if (functionName === jsAction.name) {
      currentAction = jsAction;
      break;
    }
  }

  return currentAction;
};

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

export const getActionByBaseId = (
  state: AppState,
  baseActionId: string,
): Action | undefined => {
  const action = find(
    state.entities.actions,
    (a) => a.config.baseId === baseActionId,
  );

  return action ? action.config : undefined;
};

export const getActionData = (
  state: AppState,
  actionId: string,
): ActionResponse | undefined => {
  const action = find(state.entities.actions, (a) => a.config.id === actionId);

  return action ? action.data : undefined;
};

export const getJSCollection = (state: AppState, collectionId: string) => {
  const jsaction = find(
    state.entities.jsActions,
    (a) => a.config.id === collectionId,
  );

  return jsaction && jsaction.config;
};

export const getJsCollectionByBaseId = (
  state: AppState,
  baseCollectionId: string,
) => {
  const jsaction = find(
    state.entities.jsActions,
    (a) => a.config.baseId === baseCollectionId,
  );

  return jsaction && jsaction.config;
};

/**
 *
 * getJSCollectionFromAllEntities is used to get the js collection from all jsAction entities (including module instance entities) )
 */
export const getJSCollectionFromAllEntities = (
  state: AppState,
  actionId: string,
) => {
  const jsaction = find(
    state.entities.jsActions,
    (a) => a.config.id === actionId,
  );

  return jsaction && jsaction.config;
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

export const getAppData = (state: AppState) => state.entities.app;

export const getAppStoreData = (state: AppState): AppStoreState =>
  state.entities.app.store;

export const getCanvasWidgetsStructure = (state: AppState) =>
  state.entities.canvasWidgetsStructure;

export const getPageWidgets = (state: AppState) => state.ui.pageWidgets;
export const getCurrentPageWidgets = createSelector(
  getPageWidgets,
  getCurrentPageId,
  (widgetsByPage, currentPageId) =>
    currentPageId && widgetsByPage[currentPageId]
      ? widgetsByPage[currentPageId].dsl
      : {},
);

export const getParentModalId = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  widget: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageWidgets: Record<string, any>,
) => {
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (res: any, [pageId, pageWidgets]: any) => {
        const widgetsMap = Object.entries(pageWidgets.dsl).reduce(
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.entries(widgetsMap).reduce((res: any[], [, widget]: any) => {
      res.push(widget);

      return res;
    }, []);
  },
);

export const getUISegmentItems = createSelector(getCanvasWidgets, (widgets) => {
  const items: GenericEntityItem[] = Object.values(widgets)
    .filter((widget) => widget.widgetName !== MAIN_CONTAINER_WIDGET_NAME)
    .map((widget) => ({
      icon: WidgetIconByType(widget.type),
      title: widget.widgetName,
      key: widget.widgetId,
    }));

  return items;
});

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

export const getIsReconnectingDatasourcesModalOpen = (state: AppState) =>
  state.entities.datasources.isReconnectingModalOpen;

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
    return datasources.reduce(
      (acc, datasource) => {
        acc[datasource.id] = datasource.name;

        return acc;
      },
      {} as Record<string, string>,
    );
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

export const getIsListing = (state: AppState) => {
  return state.entities.datasources.isListing;
};

export const getDatasourceLoading = (state: AppState) => {
  return state.entities.datasources.loading;
};

export const selectFilesForExplorer = createSelector(
  getCurrentActions,
  getCurrentJSCollections,
  getCurrentWorkflowActions,
  getCurrentWorkflowJSActions,
  selectDatasourceIdToNameMap,
  (
    actions,
    jsActions,
    workflowActions,
    workflowJsActions,
    datasourceIdToNameMap,
  ) => {
    const files = [
      ...actions,
      ...jsActions,
      ...workflowActions,
      ...workflowJsActions,
    ].reduce((acc, file) => {
      let group;

      if (file.config.pluginType === PluginType.JS) {
        group = GROUP_TYPES.JS_ACTIONS;
      } else if (file.config.pluginType === PluginType.API) {
        group = isEmbeddedRestDatasource(file.config.datasource)
          ? GROUP_TYPES.API
          : datasourceIdToNameMap[file.config.datasource.id] ?? GROUP_TYPES.API;
      } else if (file.config.pluginType === PluginType.AI) {
        group = isEmbeddedAIDataSource(file.config.datasource)
          ? GROUP_TYPES.AI
          : datasourceIdToNameMap[file.config.datasource.id] ?? GROUP_TYPES.AI;
      } else if (file.config.pluginType === PluginType.INTERNAL) {
        // TODO: Add a group for internal actions, currently only Workflow actions are internal
        group = GROUP_TYPES.WORKFLOWS;
      } else {
        group = datasourceIdToNameMap[file.config.datasource.id];
      }

      acc = acc.concat({
        type: file.config.pluginType,
        entity: file,
        group,
      });

      return acc;
    }, [] as Array<ExplorerFileEntity>);

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
          entity: {
            id: file.entity.config.id,
            name: file.entity.config.name,
            isMainJSCollection: file.entity?.config?.isMainJSCollection,
          },
        });

        return acc;
      },
      {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        group: "" as any,
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        files: [] as any,
      },
    );

    return groupedFiles.files;
  },
);

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  for (const action of allActions) {
    const pluginId = action.config.pluginId;
    let validationConfigs: ActionValidationConfigMap = {};

    validationConfigs = getActionValidationConfigFromPlugin(
      state.entities.plugins.editorConfigs[pluginId],
      {},
    );
    allValidationConfigs[action.config.id] = validationConfigs;
  }

  return allValidationConfigs;
};

function getActionValidationConfigFromPlugin(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorConfigs: any,
  validationConfig: ActionValidationConfigMap,
): ActionValidationConfigMap {
  let newValidationConfig: ActionValidationConfigMap = {
    ...validationConfig,
  };

  if (!editorConfigs || !editorConfigs.length) return {};

  for (const editorConfig of editorConfigs) {
    if (editorConfig.validationConfig) {
      const configProperty = editorConfig.configProperty;

      newValidationConfig[configProperty] = editorConfig.validationConfig;
    }

    if (editorConfig.children) {
      const childrenValidationConfig = getActionValidationConfigFromPlugin(
        editorConfig.children,
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

export const getJSActions = (
  state: AppState,
  JSCollectionId: string,
): JSAction[] => {
  const jsCollection = state.entities.jsActions.find(
    (jsCollectionData) => jsCollectionData.config.id === JSCollectionId,
  );

  return jsCollection?.config.actions
    ? sortBy(jsCollection?.config.actions, ["name"])
    : [];
};

export const getActiveJSActionId = (
  state: AppState,
  jsCollectionId: string,
): string | null => {
  const jsCollection = state.entities.jsActions.find(
    (jsCollectionData) => jsCollectionData.config.id === jsCollectionId,
  );

  return jsCollection?.activeJSActionId ?? null;
};

export const getIsExecutingJSAction = (
  state: AppState,
  jsCollectionId: string,
  actionId: string,
): boolean => {
  const jsCollection = state.entities.jsActions.find(
    (jsCollectionData) => jsCollectionData.config.id === jsCollectionId,
  );

  if (jsCollection?.isExecuting && jsCollection.isExecuting[actionId]) {
    return jsCollection.isExecuting[actionId];
  }

  return false;
};

export const getJSCollectionParseErrors = (
  state: AppState,
  jsCollectionName: string,
) => {
  const dataTree = state.evaluations.tree;
  const allErrors = get(
    dataTree,
    `${jsCollectionName}.${EVAL_ERROR_PATH}.body`,
    [],
  ) as EvaluationError[];

  return allErrors.filter((error) => {
    return error.errorType === PropertyEvaluationErrorType.PARSE;
  });
};

export const getNumberOfEntitiesInCurrentPage = createSelector(
  getCanvasWidgets,
  getCurrentActions,
  getCurrentJSCollections,
  (widgets, actions, jsCollections) => {
    return (
      Object.keys(widgets).length - 1 + actions.length + jsCollections.length
    );
  },
);

export const selectIsInstallerOpen = (state: AppState) =>
  state.ui.libraries.isInstallerOpen;
export const selectInstallationStatus = (state: AppState) =>
  state.ui.libraries.installationStatus;
export const selectInstalledLibraries = (state: AppState) =>
  state.ui.libraries.installedLibraries;
export const selectStatusForURL = (url: string) =>
  createSelector(selectInstallationStatus, (statusMap) => {
    return statusMap[url];
  });
export const selectIsLibraryInstalled = createSelector(
  [selectInstalledLibraries, (_: AppState, url: string) => url],
  (installedLibraries, url) => {
    return !!installedLibraries.find((lib) => lib.url === url);
  },
);

export const selectQueuedLibraries = createSelector(
  selectInstallationStatus,
  (statusMap) => {
    return Object.keys(statusMap).filter(
      (url) => statusMap[url] === InstallState.Queued,
    );
  },
);

export const selectLibrariesForExplorer = createSelector(
  selectInstalledLibraries,
  selectInstallationStatus,
  (libs, libStatus) => {
    const queuedInstalls = Object.keys(libStatus)
      .filter((key) => libStatus[key] === InstallState.Queued)
      .map((url) => {
        const recommendedLibrary = recommendedLibraries.find(
          (lib) => lib.url === url,
        );

        return {
          name: recommendedLibrary?.name || url,
          docsURL: recommendedLibrary?.url || url,
          version: recommendedLibrary?.version || "",
          url: recommendedLibrary?.url || url,
          accessor: [],
        } as JSLibrary;
      });

    return [...queuedInstalls, ...libs];
  },
);

export const getAllJSActionsData = (state: AppState) => {
  const jsActionsData: Record<string, unknown> = {};
  const jsCollections = state.entities.jsActions;

  jsCollections.forEach((collection) => {
    if (collection.data) {
      Object.keys(collection.data).forEach((actionId) => {
        const jsAction = getJSActions(state, collection.config.id).find(
          (action) => action.id === actionId,
        );

        if (jsAction) {
          jsActionsData[`${collection.config.name}.${jsAction.name}`] =
            collection.data?.[actionId];
        }
      });
    }
  });

  return jsActionsData;
};

export const selectActionByName = (actionName: string) =>
  createSelector(getCurrentActions, (actions) => {
    return actions.find((action) => action.config.name === actionName);
  });

export const selectJSCollectionByName = (collectionName: string) =>
  createSelector(getCurrentJSCollections, (collections) => {
    return collections.find(
      (collection) => collection.config.name === collectionName,
    );
  });

export const getAllDatasourceTableKeys = createSelector(
  (state: AppState) => getDatasourcesStructure(state),
  (state: AppState) => getActions(state),
  (state: AppState, dataTreePath: string | undefined) => dataTreePath,
  (
    datasourceStructures: ReturnType<typeof getDatasourcesStructure>,
    actions: ReturnType<typeof getActions>,
    dataTreePath: string | undefined,
  ) => {
    if (!dataTreePath || !datasourceStructures) return;

    const { entityName } = getEntityNameAndPropertyPath(dataTreePath);
    const action = find(actions, ({ config: { name } }) => name === entityName);

    if (!action) return;

    const datasource = action.config.datasource;
    const datasourceId = "id" in datasource ? datasource.id : undefined;

    if (!datasourceId || !(datasourceId in datasourceStructures)) return;

    const tables: Record<string, string> = {};
    const { tables: datasourceTable } = datasourceStructures[datasourceId];

    if (!datasourceTable) return;

    datasourceTable.forEach((table) => {
      if (table?.name) {
        tables[table.name] = "table";
        table.columns.forEach((column) => {
          tables[`${table.name}.${column.name}`] = column.type;
          tables[`${column.name}`] = column.type;
        });
      }
    });

    return tables;
  },
);

export const getDatasourceScopeValue = (
  state: AppState,
  datasourceId: string,
  formName: string,
) => {
  const formData = getFormValues(formName)(state) as Datasource;
  const { plugins } = state.entities;
  const { formConfigs } = plugins;
  const datasource = getDatasource(state, datasourceId);
  const pluginId = get(datasource, "pluginId", "");
  const formConfig = formConfigs[pluginId];

  if (!formConfig || (!!formConfig && formConfig.length === 0)) {
    return null;
  }

  const configProperty = "datasourceConfiguration.authentication.scopeString";
  const scopeValue = get(formData, configProperty);
  const options = formConfig[0]?.children?.find(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (child: any) => child?.configProperty === configProperty,
  )?.options;
  const label = options?.find(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (option: any) => option.value === scopeValue,
  )?.label;

  return label;
};

export const getDatasourcesUsedInApplicationByActions = (
  state: AppState,
): Datasource[] => {
  const actions = getActions(state);
  const datasources = getDatasources(state);
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

  return datasources.filter(
    (ds) =>
      datasourceIdsUsedInCurrentApplication.has(ds.id) &&
      ds.id !== TEMP_DATASOURCE_ID,
  );
};

const getOtherDatasourcesInWorkspace = (state: AppState): Datasource[] => {
  const actions = getActions(state);
  const allDatasources = getDatasources(state);
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

  return allDatasources.filter(
    (ds) =>
      !datasourceIdsUsedInCurrentApplication.has(ds.id) &&
      ds.id !== TEMP_DATASOURCE_ID,
  );
};

//This function returns the datasources which are not used by actions but visible in the workspace
export const getEntityExplorerDatasources = (state: AppState): Datasource[] => {
  const datasourcesUsedInApplication =
    getDatasourcesUsedInApplicationByActions(state);
  const otherDatasourceInWorkspace = getOtherDatasourcesInWorkspace(state);

  otherDatasourceInWorkspace.reverse();

  return otherDatasourceInWorkspace.slice(
    0,
    MAX_DATASOURCE_SUGGESTIONS - datasourcesUsedInApplication.length,
  );
};

export function getInputsForModule(): Module["inputsForm"] {
  return [];
}

export const getModuleInstances = (
  /* eslint-disable @typescript-eslint/no-unused-vars */
  state: AppState,
) => {
  return null;
};

export const getModuleInstanceEntities = () => {
  return null;
};

export const getQueryModuleInstances = () => {
  return [];
};

export const getJSModuleInstancesData = (_: AppState) => {
  return [] as Array<{
    config: JSCollection;
    data: unknown;
    name: string;
  }>;
};

export const getAllJSCollections = createSelector(
  getCurrentJSCollections,
  getCurrentModuleJSCollections,
  (currentContextJSCollections, moduleInstanceJSCollections) => {
    return [...moduleInstanceJSCollections, ...currentContextJSCollections];
  },
);

export const getIsActionConverting = (state: AppState, actionId: string) => {
  return false;
};

export const getNewEntityName = createSelector(
  getActions,
  getJSCollections,
  (_state: AppState, options: NewEntityNameOptions) => options,
  (actions, jsCollections, options) => {
    const {
      parentEntityId,
      parentEntityKey,
      prefix,
      startWithoutIndex = false,
      suffix = "",
    } = options;

    const actionNames = actions
      .filter((a) => a.config[parentEntityKey] === parentEntityId)
      .map((a) => a.config.name);
    const jsActionNames = jsCollections
      .filter((a) => a.config[parentEntityKey] === parentEntityId)
      .map((a) => a.config.name);

    const entityNames = actionNames.concat(jsActionNames);

    const prefixExists = entityNames.indexOf(`${prefix}`) > -1;

    return getNextEntityName(
      prefixExists ? `${prefix}${suffix}` : prefix,
      entityNames,
      startWithoutIndex,
    );
  },
);

export const getQuerySegmentItems = createSelector(
  getCurrentActions,
  getPlugins,
  selectDatasourceIdToNameMap,
  (actions, plugins, datasourceIdToNameMap) => {
    const pluginGroups = keyBy(plugins, "id");
    const items: EntityItem[] = actions.map((action) => {
      let group;
      const iconUrl = getAssetUrl(
        pluginGroups[action.config.pluginId]?.iconLocation,
      );

      if (action.config.pluginType === PluginType.API) {
        group = isEmbeddedRestDatasource(action.config.datasource)
          ? "APIs"
          : datasourceIdToNameMap[action.config.datasource.id] ?? "APIs";
      } else if (action.config.pluginType === PluginType.AI) {
        group = isEmbeddedAIDataSource(action.config.datasource)
          ? "AI Queries"
          : datasourceIdToNameMap[action.config.datasource.id] ?? "AI Queries";
      } else {
        group =
          action.config.datasource?.name ??
          datasourceIdToNameMap[action.config.datasource?.id];
      }

      return {
        icon: ActionUrlIcon(iconUrl, "16", "16"),
        title: action.config.name,
        key: action.config.baseId,
        type: action.config.pluginType,
        group,
        userPermissions: action.config.userPermissions,
      };
    });

    return items;
  },
);
export const getJSSegmentItems = createSelector(
  getCurrentJSCollections,
  (jsActions) => {
    const items: EntityItem[] = jsActions.map((js) => ({
      icon: JsFileIconV2(),
      title: js.config.name,
      key: js.config.baseId,
      type: PluginType.JS,
      userPermissions: js.config.userPermissions,
    }));

    return items;
  },
);

export const getSelectedTableName = (state: AppState) =>
  state.ui.datasourcePane.selectedTableName;

export const getDatasourceUsageCountForApp = createSelector(
  getActions,
  getDatasources,
  (state: AppState, editorType: string) => editorType,
  (actions, datasources, editorType) => {
    const actionCount = countBy(actions, "config.datasource.id");
    const actionDsMap: Record<string, string> = {};

    datasources.forEach((ds) => {
      actionDsMap[ds.id] = `No queries in this ${editorType}`;
    });
    Object.keys(actionCount).forEach((dsId) => {
      actionDsMap[dsId] = `${actionCount[dsId]} queries in this ${editorType}`;
    });

    return actionDsMap;
  },
);

export interface IsSavingEntityNameParams {
  id: string;
  segment: EditorEntityTab;
  entity?: EntityItem;
}

export const getIsSavingEntityName = (
  state: AppState,
  { id, segment }: IsSavingEntityNameParams,
) => {
  let isSavingEntityName = getIsSavingForApiName(state, id);

  if (EditorEntityTab.JS === segment) {
    isSavingEntityName = getIsSavingForJSObjectName(state, id);
  }

  return isSavingEntityName;
};
