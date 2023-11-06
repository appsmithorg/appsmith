import {
  type MODULE_PREFIX,
  MODULE_TYPE,
  type Module,
} from "@appsmith/constants/ModuleConstants";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import { getNextEntityName } from "utils/AppsmithUtils";

export const createNewQueryModuleName = (
  allModules: ModulesReducerState,
  prefix: MODULE_PREFIX,
) => {
  const modules: Module[] = convertModulesToArray(allModules);
  const names = modules.map((q) => q.name);
  return getNextEntityName(`${prefix}Module`, names);
};

export const convertModulesToArray = (modules: ModulesReducerState) => {
  return Object.values(modules).map((module) => module);
};

export const selectAllQueryModules = (modules: Module[]) => {
  const queryModules = modules.filter(
    (module) => module.type === MODULE_TYPE.QUERY,
  );
  return queryModules;
};
