export * from "ce/entities/DataTree/types";
import type { ActionContextType } from "ce/entities/DataTree/types";
import { ENTITY_TYPE as CE_ENTITY_TYPE } from "ce/entities/DataTree/types";

export type ActionContextTypeInterface =
  (typeof ActionContextType)[keyof typeof ActionContextType];

export const ENTITY_TYPE = {
  ...CE_ENTITY_TYPE,
  MODULE_INSTANCE: "MODULE_INSTANCE",
} as const;

type ValueOf<T> = T[keyof T];
export type EntityTypeValue = ValueOf<typeof ENTITY_TYPE>;
