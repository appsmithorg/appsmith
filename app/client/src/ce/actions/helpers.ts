import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import {
  createNewApiAction,
  createNewQueryAction,
} from "actions/apiPaneActions";
import { createNewJSCollection } from "actions/jsPaneActions";
import { ACTION_PARENT_ENTITY_TYPE } from "@appsmith/entities/Engine/actionHelpers";

export const createNewQueryBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  dsId: string,
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  if (parentEntityType === ACTION_PARENT_ENTITY_TYPE.PAGE) {
    return createNewQueryAction(entityId, from, dsId);
  }
};

export const createNewAPIBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  apiType?: string,
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  if (parentEntityType === ACTION_PARENT_ENTITY_TYPE.PAGE) {
    return createNewApiAction(entityId, from, apiType);
  }
};

export const createNewJSCollectionBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  parentEntityType = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  if (parentEntityType === ACTION_PARENT_ENTITY_TYPE.PAGE) {
    return createNewJSCollection(entityId, from);
  }
};
