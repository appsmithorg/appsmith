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
  pageId: string;
  inputs: {
    [key: string]: string;
  };
  dynamicBindingPathList: {
    [key: string]: boolean;
  };
  jsonPathKeys: {
    [key: string]: any;
  };
}
export interface QueryModuleInstance extends ModuleInstance {
  type: MODULE_TYPE.QUERY;
  jsonPathKeys: string[];
  dynamicBindingPathList: Record<string, true>;
  data: string;
  run: string;
}
