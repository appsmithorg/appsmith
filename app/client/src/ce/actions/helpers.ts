import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import {
  createNewApiAction,
  createNewQueryAction,
} from "actions/apiPaneActions";
import { createNewJSCollection } from "actions/jsPaneActions";
import { ACTION_PARENT_ENTITY_TYPE } from "@appsmith/entities/Engine/actionHelpers";
import { saveActionName } from "actions/pluginActionActions";
import { saveJSObjectName } from "actions/jsActionActions";

export const createNewQueryBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  dsId: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  return createNewQueryAction(entityId, from, dsId);
};

export const createNewAPIBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  apiType?: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  return createNewApiAction(entityId, from, apiType);
};

export const createNewJSCollectionBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  return createNewJSCollection(entityId, from);
};

export const saveActionNameBasedOnParentEntity = (
  id: string,
  name: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  return saveActionName({ id, name });
};

export const saveJSObjectNameBasedOnParentEntity = (
  id: string,
  name: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  return saveJSObjectName({ id, name });
};
