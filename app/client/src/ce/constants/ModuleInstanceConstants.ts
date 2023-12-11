import type { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { ActionResponse } from "api/ActionAPI";

export type ModuleId = string;
export type ModuleInstanceId = string;

export enum ModuleInstanceCreatorType {
  MODULE = "MODULE",
  PAGE = "PAGE",
}
export interface ModuleInstance {
  id: ModuleInstanceId;
  type: MODULE_TYPE;
  name: string;
  inputs: {
    [key: string]: string;
  };
}

export interface ModuleInstanceData {
  config: ModuleInstance;
  data: ActionResponse;
  isLoading: boolean;
}
export type ModuleInstanceDataState = ModuleInstanceData[];
