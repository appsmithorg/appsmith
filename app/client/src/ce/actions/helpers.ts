import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import { createNewJSCollection } from "actions/jsPaneActions";
import {
  ActionParentEntityType,
  type ActionParentEntityTypeInterface,
} from "ee/entities/Engine/actionHelpers";
import {
  createNewApiAction,
  createNewQueryAction,
  saveActionName,
} from "actions/pluginActionActions";
import { saveJSObjectName } from "actions/jsActionActions";
import { IDE_TYPE, type IDEType } from "ee/IDE/Interfaces/IDETypes";

export const createNewQueryBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  dsId: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType: ActionParentEntityTypeInterface = ActionParentEntityType.PAGE,
) => {
  return createNewQueryAction(entityId, from, dsId);
};

export const createNewAPIBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  apiType?: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType: ActionParentEntityTypeInterface = ActionParentEntityType.PAGE,
) => {
  return createNewApiAction(entityId, from, apiType);
};

export const createNewJSCollectionBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType = ActionParentEntityType.PAGE,
) => {
  return createNewJSCollection(entityId, from);
};

export const saveActionNameBasedOnIdeType = (
  id: string,
  name: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ideType: IDEType = IDE_TYPE.App,
) => {
  return saveActionName({ id, name });
};

export const saveJSObjectNameBasedOnIdeType = (
  id: string,
  name: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ideType: IDEType = IDE_TYPE.App,
) => {
  return saveJSObjectName({ id, name });
};

export const createNewApiActionBasedOnIdeType = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ideType: IDEType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  editorId: string,
  parentEntityId: string,
  parentEntityType: ActionParentEntityTypeInterface,
  apiType: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  if (parentEntityId) {
    return createNewAPIBasedOnParentEntity(
      parentEntityId,
      "API_PANE",
      apiType,
      parentEntityType,
    );
  }
};
