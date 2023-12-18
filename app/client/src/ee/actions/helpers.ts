import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";
import { ACTION_PARENT_ENTITY_TYPE } from "@appsmith/entities/Engine/actionHelpers";
import {
  createWorkflowAPIAction,
  createWorkflowJSCollection,
  createWorkflowQueryAction,
} from "@appsmith/actions/workflowActions";
import {
  createNewQueryBasedOnParentEntity as CE_createNewQueryBasedOnParentEntity,
  createNewAPIBasedOnParentEntity as CE_createNewAPIBasedOnParentEntity,
  createNewJSCollectionBasedOnParentEntity as CE_createNewJSCollectionBasedOnParentEntity,
} from "ce/actions/helpers";

export const createNewQueryBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  dsId: string,
  parentEntityType: ActionParentEntityTypeInterface = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  switch (parentEntityType) {
    case ACTION_PARENT_ENTITY_TYPE.WORKFLOW:
      return createWorkflowQueryAction(entityId, from, dsId);
    default:
      return CE_createNewQueryBasedOnParentEntity(entityId, from, dsId);
  }
};

export const createNewAPIBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  apiType?: string,
  parentEntityType: ActionParentEntityTypeInterface = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  switch (parentEntityType) {
    case ACTION_PARENT_ENTITY_TYPE.WORKFLOW:
      return createWorkflowAPIAction(entityId, from, apiType);
    default:
      return CE_createNewAPIBasedOnParentEntity(entityId, from, apiType);
  }
};

export const createNewJSCollectionBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  parentEntityType: ActionParentEntityTypeInterface = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  switch (parentEntityType) {
    case ACTION_PARENT_ENTITY_TYPE.WORKFLOW:
      return createWorkflowJSCollection(entityId, from);
    default:
      return CE_createNewJSCollectionBasedOnParentEntity(entityId, from);
  }
};
