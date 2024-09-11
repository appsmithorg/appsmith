import type { CreateNewActionKeyInterface } from "ee/entities/Engine/actionHelpers";
import { CreateNewActionKey } from "ee/entities/Engine/actionHelpers";
import type { DeleteErrorLogPayload } from "actions/debuggerActions";
import type { Action } from "entities/Action";
import type { Log } from "entities/AppsmithConsole";
import type { EvaluationError } from "utils/DynamicBindingUtils";

export interface ResolveParentEntityMetadataReturnType {
  parentEntityId?: string;
  parentEntityKey?: CreateNewActionKeyInterface;
}

// This function is extended in EE. Please check the EE implementation before any modification.
export const resolveParentEntityMetadata = (
  action: Partial<Action>,
): ResolveParentEntityMetadataReturnType => {
  if (action.pageId) {
    return {
      parentEntityId: action.pageId,
      parentEntityKey: CreateNewActionKey.PAGE,
    };
  }

  return { parentEntityId: undefined, parentEntityKey: undefined };
};

export function* transformAddErrorLogsSaga(logs: Log[]) {
  return logs;
}

export function* transformDeleteErrorLogsSaga(payload: DeleteErrorLogPayload) {
  return payload;
}

export function* transformTriggerEvalErrors(errors: EvaluationError[]) {
  return errors;
}
