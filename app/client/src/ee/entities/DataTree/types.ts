export * from "ce/entities/DataTree/types";
import {
  ENTITY_TYPE as CE_ENTITY_TYPE,
  CreateNewActionKey as CE_CreateNewActionKey,
  ActionContextType as CE_ActionContextType,
} from "ce/entities/DataTree/types";

export const CreateNewActionKey = {
  ...CE_CreateNewActionKey,
};

export const ActionContextType = {
  ...CE_ActionContextType,
};

export type ActionContextTypeInterface =
  (typeof ActionContextType)[keyof typeof ActionContextType];

export const ENTITY_TYPE = {
  ...CE_ENTITY_TYPE,
  MODULE_INSTANCE: "MODULE_INSTANCE",
} as const;

type ValueOf<T> = T[keyof T];
export type EntityTypeValue = ValueOf<typeof ENTITY_TYPE>;
