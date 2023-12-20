export * from "ce/entities/Engine/actionHelpers";
import type { ActionContextType } from "ce/entities/Engine/actionHelpers";
import { ACTION_PARENT_ENTITY_TYPE as CE_ACTION_PARENT_ENTITY_TYPE } from "ce/entities/Engine/actionHelpers";

export type ActionContextTypeInterface =
  (typeof ActionContextType)[keyof typeof ActionContextType];

export const ACTION_PARENT_ENTITY_TYPE = {
  ...CE_ACTION_PARENT_ENTITY_TYPE,
};

export type ActionParentEntityTypeInterface =
  (typeof ACTION_PARENT_ENTITY_TYPE)[keyof typeof ACTION_PARENT_ENTITY_TYPE];
