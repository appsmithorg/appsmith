export * from "ce/actions/helpers";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
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
  saveActionNameForPackage,
  saveJSObjectNameForPackage,
} from "./moduleActions";

export const createNewQueryBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  dsId: string,
  parentEntityType: ActionParentEntityTypeInterface = ActionParentEntityType.PAGE,
) => {
  switch (parentEntityType) {
    case ActionParentEntityType.WORKFLOW:
      return createWorkflowQueryAction(entityId, from, dsId);
    case ActionParentEntityType.MODULE:
      return createNewQueryActionForPackage(entityId, from, dsId);
    default:
      return CE_createNewQueryBasedOnParentEntity(entityId, from, dsId);
  }
};

export const createNewAPIBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  apiType?: string,
  parentEntityType: ActionParentEntityTypeInterface = ActionParentEntityType.PAGE,
) => {
  switch (parentEntityType) {
    case ActionParentEntityType.WORKFLOW:
      return createWorkflowAPIAction(entityId, from, apiType);
    case ActionParentEntityType.MODULE:
      return createNewAPIActionForPackage(entityId, from, apiType);
    default:
      return CE_createNewAPIBasedOnParentEntity(entityId, from, apiType);
  }
};

export const createNewJSCollectionBasedOnParentEntity = (
  entityId: string,
  from: EventLocation,
  parentEntityType: ActionParentEntityTypeInterface = ActionParentEntityType.PAGE,
) => {
  switch (parentEntityType) {
    case ActionParentEntityType.WORKFLOW:
      return createWorkflowJSCollection(entityId, from);
    case ActionParentEntityType.MODULE:
      return createNewJSCollectionForPackage(entityId, from);
    default:
      return CE_createNewJSCollectionBasedOnParentEntity(entityId, from);
  }
};

export const saveActionNameBasedOnParentEntity = (
  id: string,
  name: string,
  parentEntityType: ActionParentEntityTypeInterface = ActionParentEntityType.PAGE,
) => {
  switch (parentEntityType) {
    case ActionParentEntityType.MODULE:
      return saveActionNameForPackage({ id, name });
    default:
      return CE_saveActionNameBasedOnParentEntity(id, name);
  }
};

export const saveJSObjectNameBasedOnParentEntity = (
  id: string,
  name: string,
  parentEntityType: ActionParentEntityTypeInterface = ActionParentEntityType.PAGE,
) => {
  switch (parentEntityType) {
    case ActionParentEntityType.MODULE:
      return saveJSObjectNameForPackage({ id, name });
    default:
      return CE_saveJSObjectNameBasedOnParentEntity(id, name);
  }
};
