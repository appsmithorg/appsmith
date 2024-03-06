import {
  type MODULE_PREFIX,
  MODULE_TYPE,
  type Module,
} from "@appsmith/constants/ModuleConstants";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import type { PackagesReducerState } from "@appsmith/reducers/entityReducers/packagesReducer";
import type { ModuleId } from "@appsmith/constants/ModuleInstanceConstants";
import { getNextEntityName } from "utils/AppsmithUtils";

interface ExportPackageAsJSONFileProps {
  packageId: string;
  onSuccessCb?: () => void;
}

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

export const selectAllJSModules = (modules: Module[]) => {
  const jsModules = modules.filter((module) => module.type === MODULE_TYPE.JS);
  return jsModules;
};

export const getModuleIdPackageNameMap = (
  modules: Module[],
  packages: PackagesReducerState,
) => {
  const modulePackageMap: Record<ModuleId, string> = {};

  modules.forEach((module) => {
    const pkgId = module.packageId;
    modulePackageMap[module.id] = packages[pkgId]?.name || "";
  });

  return modulePackageMap;
};

export const getExportPackageAPIRoute = (
  packageId: string,
  branchName?: string,
) => {
  let exportUrl = `/api/v1/packages/export/${packageId}`;
  if (branchName) {
    exportUrl += `?branchName=${branchName}`;
  }
  return exportUrl;
};

export const exportPackageAsJSONFile = ({
  onSuccessCb,
  packageId,
}: ExportPackageAsJSONFileProps) => {
  // export api response comes with content-disposition header.
  // there is no straightforward way to handle it with axios/fetch
  const id = `t--export-app-link`;
  const existingLink = document.getElementById(id);
  existingLink && existingLink.remove();
  const link = document.createElement("a");

  link.href = getExportPackageAPIRoute(packageId);
  link.id = id;
  document.body.appendChild(link);
  // @ts-expect-error: Types are not available
  if (!window.Cypress) {
    link.click();
  }

  onSuccessCb?.();
};
