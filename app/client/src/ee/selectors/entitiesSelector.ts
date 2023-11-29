export * from "ce/selectors/entitiesSelector";
import { createSelector } from "reselect";
import {
  getActions,
  getJSCollections,
  selectFilesForExplorer as CE_selectFilesForExplorer,
} from "ce/selectors/entitiesSelector";
import type { Module } from "@appsmith/constants/ModuleConstants";
import {
  getAllModules,
  getCurrentModuleId,
  getModuleInstanceActions,
  getModuleInstanceJSCollections,
} from "@appsmith/selectors/modulesSelector";
import type { ModuleInstanceReducerState } from "@appsmith/reducers/entityReducers/moduleInstancesReducer";
import type { AppState } from "@appsmith/reducers";
import { sortBy } from "lodash";
import { getAllModuleInstances } from "./moduleInstanceSelectors";
import { getPackages } from "./packageSelectors";
import type { ExplorerFileEntityForModule } from "@appsmith/pages/Editor/Explorer/helpers";
import { getPackageNameForModule } from "@appsmith/utils/Packages/moduleHelpers";

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
    return moduleInstanceJSCollections || [];
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
    const moduleInstanceFiles = Object.values(moduleInstances).reduce(
      (acc, file) => {
        const group = getPackageNameForModule(
          modules,
          packages,
          file.sourceModuleId,
        );
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
