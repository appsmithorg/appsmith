import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import type { ModuleInstanceData } from "ee/constants/ModuleInstanceConstants";

export type GetQueryBindingValue = (
  query: ActionData | ModuleInstanceData,
) => string;
