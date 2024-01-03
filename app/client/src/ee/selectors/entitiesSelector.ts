export * from "ce/selectors/entitiesSelector";
import { createSelector } from "reselect";
import {
  getAction as CE_getAction,
  getActionData as CE_getActionData,
  getActions,
  getJSCollections,
  selectFilesForExplorer as CE_selectFilesForExplorer,
  getCurrentJSCollections,
  selectDatasourceIdToNameMap,
} from "ce/selectors/entitiesSelector";
import { MODULE_TYPE, type Module } from "@appsmith/constants/ModuleConstants";
import {
  getAllModules,
  getCurrentModuleId,
  getModuleInstanceActions,
  getModuleInstanceJSCollections,
} from "@appsmith/selectors/modulesSelector";
import type { ModuleInstanceReducerState } from "@appsmith/reducers/entityReducers/moduleInstancesReducer";
import type { AppState } from "@appsmith/reducers";
import { find, sortBy } from "lodash";
import { getAllModuleInstances } from "./moduleInstanceSelectors";
import { getPackages } from "./packageSelectors";
import type {
  ExplorerFileEntity,
  ExplorerFileEntityForModule,
} from "@appsmith/pages/Editor/Explorer/helpers";
import {
  convertModulesToArray,
  getModuleIdPackageNameMap,
} from "@appsmith/utils/Packages/moduleHelpers";
import type { ActionResponse } from "api/ActionAPI";
import { PluginType, type Action } from "entities/Action";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import { isEmbeddedRestDatasource } from "entities/Datasource";
import type { JSCollection } from "entities/JSCollection";

export const getCurrentModule = createSelector(
  getAllModules,
  getCurrentModuleId,
  (modules, currentModuleId) => {
    return modules[currentModuleId];
  },
);

export const getInputsForModule = (state: AppState): Module["inputsForm"] => {
  const moduleId = getCurrentModuleId(state);
  const module = state.entities.modules[moduleId];
  return module?.inputsForm || [];
};

export const getCurrentModuleActions = createSelector(
  getCurrentModuleId,
  getActions,
  getModuleInstanceActions,
  (moduleId, actions, moduleInstanceActions) => {
    if (!!moduleId.length) return actions;
    return moduleInstanceActions || [];
  },
);

export const getCurrentModuleJSCollections = createSelector(
  getCurrentModuleId,
  getJSCollections,
  getModuleInstanceJSCollections,
  (moduleId, moduleJSCollections, moduleInstanceJSCollections) => {
    if (!!moduleId) return moduleJSCollections;
    return moduleInstanceJSCollections;
  },
);

export const getModuleInstances = (
  state: AppState,
): ModuleInstanceReducerState => state.entities.moduleInstances;

export const getModuleInstanceEntities = (state: AppState) =>
  state.entities.moduleInstanceEntities;

export const selectFilesForExplorer = createSelector(
  CE_selectFilesForExplorer,
  getAllModuleInstances,
  getAllModules,
  getPackages,
  (CE_files, moduleInstances, modules, packages) => {
    const modulesArray = convertModulesToArray(modules);
    const modulePackageMap = getModuleIdPackageNameMap(modulesArray, packages);
    const moduleInstanceFiles = Object.values(moduleInstances).reduce(
      (acc, file) => {
        const group = modulePackageMap[file.sourceModuleId] || "Packages";
        acc = acc.concat({
          type: "moduleInstance",
          entity: file,
          group,
        });
        return acc;
      },
      [] as Array<ExplorerFileEntityForModule>,
    );

    const filteredCEFiles = CE_files.filter(
      (file: any) => file.type !== "group",
    );

    const filesSortedByGroupName = sortBy(
      [...filteredCEFiles, ...moduleInstanceFiles],
      [
        (file) => file.entity?.isMainJSCollection,
        (file) => file.group?.toLowerCase(),
        (file: any) => file.entity?.name?.toLowerCase(),
      ],
    );

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
            id: file.entity?.id,
            name: file.entity?.name,
            isMainJSCollection: file.entity?.config?.isMainJSCollection,
          },
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

export const getAction = (
  state: AppState,
  actionId: string,
): Action | undefined => {
  const action = CE_getAction(state, actionId);
  if (action) return action;
  const moduleInstanceAction = find(
    getModuleInstanceEntities(state).actions,
    (a) => a.config.id === actionId,
  );
  if (moduleInstanceAction) return moduleInstanceAction.config;
};

export const getActionData = (
  state: AppState,
  actionId: string,
): ActionResponse | undefined => {
  const actionData = CE_getActionData(state, actionId);
  if (actionData) return actionData;
  const moduleInstanceAction = find(
    getModuleInstanceEntities(state).actions,
    (a) => a.config.id === actionId,
  );
  if (moduleInstanceAction) return moduleInstanceAction.data;
};

export const getQueryModuleInstances = createSelector(
  getModuleInstances,
  getModuleInstanceEntities,
  (moduleInstances, moduleInstanceEntities) => {
    const queryModuleInstances = Object.values(moduleInstances).map(
      (instance) => {
        if (instance.type === MODULE_TYPE.QUERY) {
          const getPublicAction = moduleInstanceEntities.actions.find(
            (entity: ActionData) =>
              entity.config.moduleInstanceId === instance.id,
          );
          return {
            config: instance,
            data: getPublicAction?.data,
          };
        }
      },
    );
    return queryModuleInstances.filter((instance) => !!instance);
  },
);

export const getJSModuleInstancesData = createSelector(
  getModuleInstances,
  getModuleInstanceEntities,
  (moduleInstances, moduleInstanceEntities) => {
    const JSModuleInstances = Object.values(moduleInstances).map((instance) => {
      if (instance.type === MODULE_TYPE.JS) {
        const getPublicAction = moduleInstanceEntities.jsCollections.find(
          (entity: ActionData) =>
            entity.config.moduleInstanceId === instance.id,
        );

        return {
          config: getPublicAction.config as JSCollection,
          data: getPublicAction?.data,
          name: instance.name,
        };
      }
    });
    return JSModuleInstances.filter((instance) => !!instance);
  },
);

/**
 *
 * getJSCollectionFromAllEntities is used to get the js collection from all jsAction entities (including module instance entities) )
 */
export const getJSCollectionFromAllEntities = (
  state: AppState,
  actionId: string,
) => {
  const jsaction = find(
    [
      ...state.entities.jsActions,
      ...state.entities.moduleInstanceEntities.jsCollections,
    ],
    (a) => a.config.id === actionId,
  );
  return jsaction && jsaction.config;
};

export const getAllJSCollections = createSelector(
  getCurrentJSCollections,
  getCurrentModuleJSCollections,
  (currentContextJSCollections, moduleInstanceJSCollections) => {
    return [...moduleInstanceJSCollections, ...currentContextJSCollections];
  },
);

export const getPrivateActions = createSelector(getActions, (actions) =>
  actions.filter((action) => !action.config.isPublic),
);

export const selectFilesForPackageExplorer = createSelector(
  getPrivateActions,
  getJSCollections,
  selectDatasourceIdToNameMap,
  (actions, jsActions, datasourceIdToNameMap) => {
    const files = [...actions, ...jsActions].reduce((acc, file) => {
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
        group: "" as any,
        files: [] as any,
      },
    );
    return groupedFiles.files;
  },
);
