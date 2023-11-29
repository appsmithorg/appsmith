import {
  type MODULE_PREFIX,
  MODULE_TYPE,
  type Module,
} from "@appsmith/constants/ModuleConstants";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import { getNextEntityName } from "utils/AppsmithUtils";

export const createNewModuleName = (
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

export const getPackageNameForModule = (
  modules: Record<string, Module>,
  packages: Record<string, Package>,
  moduleId: string,
) => {
  const module = modules[moduleId];
  const packageName = module ? packages[module.packageId]?.name : "";
  return packageName || "Packages";
};
