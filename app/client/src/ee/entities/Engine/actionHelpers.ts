export * from "ce/entities/Engine/actionHelpers";
import type { CreateNewActionKey } from "ce/entities/Engine/actionHelpers";
import { ActionParentEntityType as CE_ActionParentEntityType } from "ce/entities/Engine/actionHelpers";

export type CreateNewActionKeyInterface =
  (typeof CreateNewActionKey)[keyof typeof CreateNewActionKey];

export const ActionParentEntityType = {
  ...CE_ActionParentEntityType,
};

export type ActionParentEntityTypeInterface =
  (typeof ActionParentEntityType)[keyof typeof ActionParentEntityType];
