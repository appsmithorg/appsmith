import type { Diff } from "deep-diff";

export const ENTITY_TYPE = {
  ACTION: "ACTION",
  WIDGET: "WIDGET",
  APPSMITH: "APPSMITH",
  JSACTION: "JSACTION",
};

type ValueOf<T> = T[keyof T];
export type EntityTypeValue = ValueOf<typeof ENTITY_TYPE>;

export interface IEntity {
  getName(): string;
  getId(): string;
  getType(): EntityTypeValue;
  getRawEntity(): unknown;
  getConfig(): unknown;
  computeDifference(entity?: IEntity): Diff<unknown>[] | undefined;
}
