import type { CreateNewActionKeyInterface } from "@appsmith/entities/Engine/actionHelpers";
import { CreateNewActionKey } from "@appsmith/entities/Engine/actionHelpers";
import type { Action } from "entities/Action";
import type { Log } from "entities/AppsmithConsole";

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

export function* transformErrorLogsSaga(logs: Log[]) {
  return logs;
}
