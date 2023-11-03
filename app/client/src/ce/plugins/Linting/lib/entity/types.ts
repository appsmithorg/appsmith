import type { Diff } from "deep-diff";

export enum ENTITY_TYPE {
  ACTION = "ACTION",
  WIDGET = "WIDGET",
  APPSMITH = "APPSMITH",
  JSACTION = "JSACTION",
}

export interface IEntity {
  getName(): string;
  getId(): string;
  getType(): ENTITY_TYPE;
  getRawEntity(): unknown;
  getConfig(): unknown;
  computeDifference(entity?: IEntity): Diff<unknown>[] | undefined;
}
