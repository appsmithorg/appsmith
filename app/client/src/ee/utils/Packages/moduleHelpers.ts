import { MODULE_TYPE, type Module } from "@appsmith/constants/ModuleConstants";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";

export const convertModulesToArray = (modules: ModulesReducerState) => {
  return Object.values(modules).map((module) => module);
};

export const selectAllQueryModules = (modules: Module[]) => {
  const queryModules = modules.filter(
    (module) => module.type === MODULE_TYPE.QUERY,
  );
  return queryModules;
};
