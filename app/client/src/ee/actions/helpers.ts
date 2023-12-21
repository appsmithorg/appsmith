export * from "ce/actions/helpers";
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
  saveActionNameBasedOnParentEntity as CE_saveActionNameBasedOnParentEntity,
  saveJSObjectNameBasedOnParentEntity as CE_saveJSObjectNameBasedOnParentEntity,
} from "ce/actions/helpers";
import {
  createNewAPIActionForPackage,
  createNewJSCollectionForPackage,
  createNewQueryActionForPackage,
} from "./moduleActions";

export const createNewQueryBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  dsId: string,
  parentEntityType: ActionParentEntityTypeInterface = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  switch (parentEntityType) {
    case ACTION_PARENT_ENTITY_TYPE.WORKFLOW:
      return createWorkflowQueryAction(entityId, from, dsId);
    case ACTION_PARENT_ENTITY_TYPE.PACKAGE:
      return createNewQueryActionForPackage(entityId, from, dsId);
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
    case ACTION_PARENT_ENTITY_TYPE.PACKAGE:
      return createNewAPIActionForPackage(entityId, from, apiType);
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
    case ACTION_PARENT_ENTITY_TYPE.PACKAGE:
      return createNewJSCollectionForPackage(entityId, from);
    default:
      return CE_createNewJSCollectionBasedOnParentEntity(entityId, from);
  }
};

export const saveActionNameBasedOnParentEntity = (
  id: string,
  name: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType: ActionParentEntityTypeInterface = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  switch (parentEntityType) {
    case ACTION_PARENT_ENTITY_TYPE.PACKAGE:
      return CE_saveActionNameBasedOnParentEntity(id, name);
    default:
      return CE_saveActionNameBasedOnParentEntity(id, name);
  }
};

export const saveJSObjectNameBasedOnParentEntity = (
  id: string,
  name: string,
  // Used in EE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentEntityType: ActionParentEntityTypeInterface = ACTION_PARENT_ENTITY_TYPE.PAGE,
) => {
  switch (parentEntityType) {
    case ACTION_PARENT_ENTITY_TYPE.PACKAGE:
      return CE_saveJSObjectNameBasedOnParentEntity(id, name);
    default:
      return CE_saveJSObjectNameBasedOnParentEntity(id, name);
  }
};
