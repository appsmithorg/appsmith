export * from "ce/constants/ModuleInstanceConstants";
import type {
  ModuleInstance as CE_ModuleInstance,
  ModuleInstanceCreatorType,
} from "ce/constants/ModuleInstanceConstants";
import type { MODULE_TYPE } from "./ModuleConstants";
export interface ModuleInstance
  extends Omit<CE_ModuleInstance, "moduleId" | "creatorId" | "creatorType"> {
  sourceModuleId: string;
  contextId: string;
  contextType: ModuleInstanceCreatorType;
  userPermissions?: string[];
}
export interface QueryModuleInstance extends ModuleInstance {
  type: MODULE_TYPE.QUERY;
  jsonPathKeys: string[];
  dynamicBindingPathList: Record<string, true>;
}
