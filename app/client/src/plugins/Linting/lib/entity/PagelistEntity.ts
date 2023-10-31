import type { PagelistEntity as TPageListEntity } from "@appsmith/entities/DataTree/types";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";

export class PagelistEntity implements IEntity {
  private entity: TPageListEntity;
  private config: undefined;
  constructor(entity: TPageListEntity, config: undefined) {
    this.entity = entity;
    this.config = config;
  }
  getType() {
    return ENTITY_TYPE.PAGELIST;
  }
  getConfig() {
    return this.config;
  }
  getRawEntity() {
    return this.entity;
  }
  getName() {
    return "pageList";
  }
  getId() {
    return "pageList";
  }
  computeDifference(): Diff<unknown>[] | undefined {
    return;
  }
}
