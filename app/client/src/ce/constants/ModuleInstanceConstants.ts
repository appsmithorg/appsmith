import type { MODULE_TYPE } from "ee/constants/ModuleConstants";
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
  sourceModuleId: ModuleId;
}

export interface ModuleInstanceData {
  config: ModuleInstance;
  data: ActionResponse | undefined;
  isLoading: boolean;
}
export type ModuleInstanceDataState = ModuleInstanceData[];
