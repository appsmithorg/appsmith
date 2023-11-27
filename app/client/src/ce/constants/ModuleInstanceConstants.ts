import type { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

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
}
