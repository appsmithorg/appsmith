import {
  isAction,
  isAppsmithEntity as isAppsmith,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  JSActionEntity as TJSActionEntity,
  ActionEntity as TActionEntity,
  PagelistEntity as TPageListEntity,
  ActionEntityConfig as TActionEntityConfig,
  JSActionEntityConfig as TJSActionEntityConfig,
} from "entities/DataTree/types";
import type {
  WidgetEntity as TWidgetEntity,
  AppsmithEntity as TAppsmithEntity,
  DataTreeEntityConfig,
  DataTreeEntity,
  WidgetEntityConfig as TWidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { Diff } from "deep-diff";

export type TEntityParser = (entity: TEntity) => unknown;
export type TDiffGenerator = (
  entity1?: TEntity,
  entity2?: TEntity,
) => Diff<unknown>[] | undefined;

enum ENTITY_TYPE {
  ACTION = "ACTION",
  WIDGET = "WIDGET",
  APPSMITH = "APPSMITH",
  JSACTION = "JSACTION",
  PAGELIST = "PAGELIST",
}

export type IEntity<
  T extends DataTreeEntity = DataTreeEntity,
  K extends DataTreeEntityConfig | undefined = DataTreeEntityConfig,
> = {
  getName(): string;
  getId(): string;
  getType(): ENTITY_TYPE;
  getRawEntity(): T;
  getConfig(): K;
  computeDifference(entity?: TEntity): ReturnType<TDiffGenerator>;
};

export default class EntityFactory {
  static getEntity<
    T extends DataTreeEntity,
    K extends DataTreeEntityConfig | undefined,
    P extends TEntityParser,
    D extends TDiffGenerator,
  >(entity: T, config: K, entityParser: P, diffGenerator: D) {
    if (isWidget(entity)) {
      return new WidgetEntity(
        entity,
        config as TWidgetEntityConfig,
        entityParser,
        diffGenerator,
      );
    } else if (isJSAction(entity)) {
      return new JSEntity(
        entity,
        config as TJSActionEntityConfig,
        entityParser,
        diffGenerator,
      );
    } else if (isAction(entity)) {
      return new ActionEntity(
        entity,
        config as TActionEntityConfig,
        entityParser,
        diffGenerator,
      );
    } else if (isAppsmith(entity)) {
      return new AppsmithEntity(entity, undefined, entityParser, diffGenerator);
    } else {
      return new PagelistEntity(
        entity as TPageListEntity,
        undefined,
        entityParser,
        diffGenerator,
      );
    }
  }
}

export class ActionEntity
  implements IEntity<TActionEntity, TActionEntityConfig>
{
  private entity: TActionEntity;
  private config: TActionEntityConfig;
  entityParser: TEntityParser;
  diffGenerator: TDiffGenerator;
  constructor(
    entity: TActionEntity,
    config: TActionEntityConfig,
    entityParser: TEntityParser,
    diffGenerator: TDiffGenerator,
  ) {
    this.entity = entity;
    this.config = config;
    this.entityParser = entityParser;
    this.diffGenerator = diffGenerator;
  }
  getType() {
    return ENTITY_TYPE.ACTION;
  }
  getRawEntity() {
    return this.entity;
  }
  getName() {
    return this.config.name;
  }
  getId() {
    return this.config.actionId;
  }
  getConfig() {
    return this.config;
  }
  computeDifference(oldEntity?: TEntity) {
    return this.diffGenerator(oldEntity, this);
  }
}

export class WidgetEntity
  implements IEntity<TWidgetEntity, TWidgetEntityConfig>
{
  private entity: TWidgetEntity;
  private config: TWidgetEntityConfig;
  entityParser: TEntityParser;
  diffGenerator: TDiffGenerator;
  constructor(
    entity: TWidgetEntity,
    config: TWidgetEntityConfig,
    entityParser: TEntityParser,
    diffGenerator: TDiffGenerator,
  ) {
    this.entity = entity;
    this.config = config;
    this.entityParser = entityParser;
    this.diffGenerator = diffGenerator;
  }
  getType(): ENTITY_TYPE {
    return ENTITY_TYPE.WIDGET;
  }
  getRawEntity() {
    return this.entity;
  }
  getName() {
    return this.entity.widgetName;
  }
  getId() {
    return this.config.widgetId as string;
  }
  getConfig() {
    return this.config;
  }
  computeDifference(oldEntity?: TEntity) {
    return this.diffGenerator(oldEntity, this);
  }
}

export class JSEntity
  implements IEntity<TJSActionEntity, TJSActionEntityConfig>
{
  entity: TJSActionEntity;
  private config: TJSActionEntityConfig;
  entityParser: TEntityParser;
  diffGenerator: TDiffGenerator;

  constructor(
    entity: TJSActionEntity,
    config: TJSActionEntityConfig,
    entityParser: TEntityParser,
    diffGenerator: TDiffGenerator,
  ) {
    this.entity = entity;
    this.config = config;
    this.entityParser = entityParser;
    this.diffGenerator = diffGenerator;
  }
  getType() {
    return ENTITY_TYPE.JSACTION;
  }
  getRawEntity() {
    return this.entity;
  }
  getConfig() {
    return this.config;
  }
  getName() {
    return this.config.name;
  }
  getId() {
    return this.config.actionId;
  }
  isEqual(body: string) {
    return body === this.getRawEntity().body;
  }
  computeDifference(oldEntity?: TEntity) {
    return this.diffGenerator(oldEntity, this);
  }
}

export class PagelistEntity implements IEntity<TPageListEntity, undefined> {
  private entity: TPageListEntity;
  private config: undefined;
  entityParser: TEntityParser = this.getRawEntity;
  diffGenerator: TDiffGenerator;
  constructor(
    entity: TPageListEntity,
    config: undefined,
    entityParser: TEntityParser,
    diffGenerator: TDiffGenerator,
  ) {
    this.entity = entity;
    this.config = config;
    this.entityParser = entityParser;
    this.diffGenerator = diffGenerator;
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
  computeDifference(oldEntity?: TEntity) {
    return this.diffGenerator(oldEntity, this);
  }
}

export class AppsmithEntity implements IEntity<TAppsmithEntity, undefined> {
  private entity: TAppsmithEntity;
  private config: undefined;
  entityParser: TEntityParser = this.getRawEntity;
  diffGenerator: TDiffGenerator;
  constructor(
    entity: TAppsmithEntity,
    config: undefined,
    entityParser: TEntityParser,
    diffGenerator: TDiffGenerator,
  ) {
    this.entity = entity;
    this.config = config;
    this.entityParser = entityParser;
    this.diffGenerator = diffGenerator;
  }
  getType() {
    return ENTITY_TYPE.APPSMITH;
  }
  getConfig() {
    return this.config;
  }
  getRawEntity(): TAppsmithEntity {
    return this.entity;
  }
  getName() {
    return "appsmith";
  }
  getId(): string {
    return "appsmith";
  }
  computeDifference(oldEntity?: TEntity) {
    return this.diffGenerator(oldEntity, this);
  }
}

export type TEntity = ReturnType<typeof EntityFactory.getEntity>;

export function isJSEntity(entity: TEntity): entity is JSEntity {
  return entity.getType() === ENTITY_TYPE.JSACTION;
}
export function isActionEntity(entity: TEntity): entity is ActionEntity {
  return entity.getType() === ENTITY_TYPE.ACTION;
}
export function isAppsmithEntity(entity: TEntity): entity is AppsmithEntity {
  return entity.getType() === ENTITY_TYPE.APPSMITH;
}
export function isWidgetEntity(entity: TEntity): entity is WidgetEntity {
  return entity.getType() === ENTITY_TYPE.WIDGET;
}
export function isPagelistEntity(entity: TEntity): entity is PagelistEntity {
  return entity.getType() === ENTITY_TYPE.PAGELIST;
}

// only Widgets, jsActions and Actions have paths that can be dynamic
export function isDynamicEntity(
  entity: TEntity,
): entity is JSEntity | WidgetEntity | ActionEntity {
  return [
    ENTITY_TYPE.JSACTION,
    ENTITY_TYPE.WIDGET,
    ENTITY_TYPE.ACTION,
  ].includes(entity.getType());
}
