import { ENTITY_TYPE } from "entities/DataTree/types";
import type { JSActionEntity as TJSActionEntity } from "entities/DataTree/types";
import type { IEntity } from ".";

export class JSEntity implements IEntity<TJSActionEntity> {
  private entity: TJSActionEntity;
  private config: any;
  constructor(entity: TJSActionEntity, config: any) {
    this.entity = entity;
    this.config = config;
  }
  getType(): ENTITY_TYPE {
    return ENTITY_TYPE.JSACTION;
  }
  getRawEntity(): TJSActionEntity {
    return this.entity;
  }
  getConfig() {
    return this.config;
  }
  getName(): string {
    return this.config.name;
  }
  getId(): string {
    throw new Error("Method not implemented.");
  }
}
