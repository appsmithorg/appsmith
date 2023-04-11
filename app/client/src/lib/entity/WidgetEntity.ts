import { ENTITY_TYPE } from "entities/DataTree/types";
import type { WidgetEntity as TWidgetEntity } from "entities/DataTree/dataTreeFactory";
import type { IEntity } from ".";

export class WidgetEntity implements IEntity<TWidgetEntity> {
  private entity: TWidgetEntity;
  private config: any;
  constructor(entity: TWidgetEntity, config: any) {
    this.entity = entity;
    this.config = config;
  }
  getType(): ENTITY_TYPE {
    return ENTITY_TYPE.WIDGET;
  }
  getRawEntity() {
    return this.entity;
  }
  getName(): string {
    return this.config.name;
  }
  getId(): string {
    throw new Error("Method not implemented.");
  }
  getConfig() {
    return this.config;
  }
}
