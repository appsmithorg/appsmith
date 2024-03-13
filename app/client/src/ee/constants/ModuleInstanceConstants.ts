export * from "ce/constants/ModuleInstanceConstants";
import type { ModuleInstance } from "ce/constants/ModuleInstanceConstants";
import type { ActionResponse } from "api/ActionAPI";

export interface ModuleInstanceData {
  config: ModuleInstance;
  data: ActionResponse | undefined;
  isLoading: boolean;
}
export type ModuleInstanceDataState = ModuleInstanceData[];
