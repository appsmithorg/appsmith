import {
  isAction,
  isJSAction,
  isWidget,
} from "ce/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/types";
import type {
  JSActionEntity as TJSActionEntity,
  ActionEntity as TActionEntity,
} from "entities/DataTree/types";
import type {
  WidgetEntity as TWidgetEntity,
  AppsmithEntity as TAppsmithEntity,
} from "entities/DataTree/dataTreeFactory";

export type IEntity<T extends DataTreeEntity = DataTreeEntity> = {
  getName(): string;
  getId(): string;
  getType(): ENTITY_TYPE;
  getRawEntity(): T;
};

export default class EntityFactory {
  static getEntity<T extends DataTreeEntity>(entity: T, config: any) {
    if (isWidget(entity)) {
      return new WidgetEntity(entity, config);
    } else if (isJSAction(entity)) {
      return new JSEntity(entity, config);
    } else if (isAction(entity)) {
      return new ActionEntity(entity, config);
    } else {
      return new AppsmithEntity(entity, config);
    }
  }
}

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
    throw new Error("Method not implemented.");
  }
  getId(): string {
    throw new Error("Method not implemented.");
  }
  getConfig() {
    return this.config;
  }
}

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
    throw new Error("Method not implemented.");
  }
  getId(): string {
    throw new Error("Method not implemented.");
  }
  getConfig() {
    return this.config;
  }
}

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
    throw new Error("Method not implemented.");
  }
  getId(): string {
    throw new Error("Method not implemented.");
  }
}

export class AppsmithEntity implements IEntity<TAppsmithEntity> {
  private entity: TAppsmithEntity;
  private config: any;
  constructor(entity: TAppsmithEntity, config: any) {
    this.entity = entity;
    this.config = config;
  }
  getType(): ENTITY_TYPE {
    return ENTITY_TYPE.APPSMITH;
  }
  getConfig() {
    return this.config;
  }
  getRawEntity(): TAppsmithEntity {
    return this.entity;
  }
  getName(): string {
    throw new Error("Method not implemented.");
  }
  getId(): string {
    throw new Error("Method not implemented.");
  }
}
