export * from "ce/sagas/helpers";
import type { ResolveParentEntityMetadataReturnType } from "ce/sagas/helpers";
import { CreateNewActionKey } from "@appsmith/entities/Engine/actionHelpers";
import { resolveParentEntityMetadata as CE_resolveParentEntityMetadata } from "ce/sagas/helpers";
import type { Action } from "entities/Action";

export const resolveParentEntityMetadata = (
  action: Partial<Action>,
): ResolveParentEntityMetadataReturnType => {
  const result = CE_resolveParentEntityMetadata(action);

  if (result.parentEntityId) return result;

  if (action.moduleId) {
    return {
      parentEntityId: action.moduleId,
      parentEntityKey: CreateNewActionKey.MODULE,
    };
  }

  if (action.workflowId) {
    return {
      parentEntityId: action.workflowId,
      parentEntityKey: CreateNewActionKey.WORKFLOW,
    };
  }

  return { parentEntityId: undefined, parentEntityKey: undefined };
};
