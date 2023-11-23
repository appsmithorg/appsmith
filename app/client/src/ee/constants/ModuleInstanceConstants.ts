import type { MODULE_TYPE } from "./ModuleConstants";

export type ModuleId = string;
export type ModuleInstanceId = string;

export enum ModuleInstanceCreatorType {
  MODULE = "MODULE",
  PAGE = "PAGE",
}
export interface ModuleInstance {
  id: ModuleInstanceId;
  type: MODULE_TYPE;
  moduleId: ModuleId;
  name: string;
  creatorId: string;
  creatorType: ModuleInstanceCreatorType;
  inputs: {
    [key: string]: string;
  };
  jsonPathKeys: {
    [key: string]: any;
  };
  userPermissions?: string[];
}
export interface QueryModuleInstance extends ModuleInstance {
  type: MODULE_TYPE.QUERY;
  jsonPathKeys: string[];
  dynamicBindingPathList: Record<string, true>;
  data: string;
  run: string;
}
