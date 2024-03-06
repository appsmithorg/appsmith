import type {
  Module,
  ModuleMetadata,
} from "@appsmith/constants/ModuleConstants";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { klona } from "klona";
import { groupBy, sortBy } from "lodash";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";

type ModulesMap = Record<MODULE_TYPE, ExtendedModule[]>;

export type ExtendedModule = Module & ModuleMetadata;

interface HandlerProps {
  modules: ExtendedModule[];
}

interface GroupModulesProps {
  modules: ModulesReducerState;
  modulesMetadata: Record<string, ModuleMetadata>;
}

const jsModuleHandler = ({ modules }: HandlerProps) => {
  return modules;
};

const queryModuleHandler = ({ modules }: HandlerProps) => {
  const modulesGroupedByPluginType = groupBy(modules, (m) => m.pluginType);

  let groupedModules: ExtendedModule[] = [];

  Object.values(modulesGroupedByPluginType).forEach((modules) => {
    const groupModulesByDatasourceId = groupBy(modules, (m) => m.datasourceId);

    Object.values(groupModulesByDatasourceId).forEach((modules) => {
      groupedModules = [...groupedModules, ...modules];
    });
  });

  return groupedModules;
};

const handlers = {
  [MODULE_TYPE.QUERY]: queryModuleHandler,
  [MODULE_TYPE.JS]: jsModuleHandler,
  [MODULE_TYPE.UI]: undefined,
};

const DEFAULT_MODULES_MAP: ModulesMap = {
  [MODULE_TYPE.UI]: [],
  [MODULE_TYPE.JS]: [],
  [MODULE_TYPE.QUERY]: [],
};

function mergeModulesAndMetaData(
  modules: Module[],
  modulesMetaData: Record<string, ModuleMetadata>,
) {
  return modules.map((m) => ({
    ...m,
    ...modulesMetaData[m.id],
  }));
}

export function groupModules({ modules, modulesMetadata }: GroupModulesProps) {
  const modulesInArray = Object.values(modules);
  const modulesMap = klona(DEFAULT_MODULES_MAP);

  const extendedModules = mergeModulesAndMetaData(
    modulesInArray,
    modulesMetadata,
  );
  const sortedExtendedModules = sortBy(extendedModules, ["name"]);
  const modulesGroupedByType = groupBy(
    sortedExtendedModules,
    ({ type }) => type,
  );

  Object.entries(modulesGroupedByType).forEach(([moduleType, modules]) => {
    const handler = handlers[moduleType as MODULE_TYPE];

    if (handler) {
      modulesMap[moduleType as MODULE_TYPE] = handler({ modules });
    }
  });

  return { modulesMap, modulesCount: modulesInArray.length };
}
