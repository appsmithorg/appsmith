export * from "ce/constants/ModuleInstanceConstants";
import type {
  ModuleInstance as CE_ModuleInstance,
  ModuleInstanceCreatorType,
} from "ce/constants/ModuleInstanceConstants";
import type { MODULE_TYPE } from "./ModuleConstants";
export interface ModuleInstance extends CE_ModuleInstance {
  userPermissions: string[];
  sourceModuleId: string;
  contextId: string;
  contextType: ModuleInstanceCreatorType;
  jsonPathKeys: string[];
  dynamicBindingPathList?: Record<string, true>;
}
export interface QueryModuleInstance extends ModuleInstance {
  type: MODULE_TYPE.QUERY;
}
export interface JSModuleInstance extends ModuleInstance {
  type: MODULE_TYPE.JS;
}
