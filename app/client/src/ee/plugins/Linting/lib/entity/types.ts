export * from "ce/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";
import { ENTITY_TYPE as CE_ENTITY_TYPE } from "ce/plugins/Linting/lib/entity/types";

export const ENTITY_TYPE = {
  ...CE_ENTITY_TYPE,
  MODULE_INPUT: "MODULE_INPUT",
  MODULE_INSTANCE: "MODULE_INSTANCE",
};

type ValueOf<T> = T[keyof T];

export interface IEntity {
  getName(): string;
  getId(): string;
  getType(): ValueOf<typeof ENTITY_TYPE>;
  getRawEntity(): unknown;
  getConfig(): unknown;
  computeDifference(entity?: IEntity): Diff<unknown>[] | undefined;
}
