import { ENTITY_TYPE } from "entities/DataTree/types";
import type { ActionEntity as TActionEntity } from "entities/DataTree/types";
import type { IEntity } from ".";

export class ActionEntity implements IEntity<TActionEntity> {
  private entity: TActionEntity;
  private config: any;
  constructor(entity: TActionEntity, config: any) {
    this.entity = entity;
    this.config = config;
  }
  getType(): ENTITY_TYPE {
    return ENTITY_TYPE.ACTION;
  }
  getRawEntity() {
    return this.entity;
  }
  getName(): string {
    return this.config.name;
  }
  getId(): string {
    return this.config.actionId;
  }
  getConfig() {
    return this.config;
  }
}
