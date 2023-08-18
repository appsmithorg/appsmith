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
import {
  defaultDiffGenerator,
  type EntityDiffGenerator,
} from "plugins/Linting/utils/diffGenerator";
import type { EntityParser } from "plugins/Linting/utils/entityParser";
import type { Diff } from "deep-diff";
import type { EntityClassLoader } from "./EntityTree";

import type { TParsedJSProperty } from "@shared/ast";
import { isJSFunctionProperty } from "@shared/ast";

enum ENTITY_TYPE {
  ACTION = "ACTION",
  WIDGET = "WIDGET",
  APPSMITH = "APPSMITH",
  JSACTION = "JSACTION",
  PAGELIST = "PAGELIST",
}

export interface IEntity {
  getName(): string;
  getId(): string;
  getType(): ENTITY_TYPE;
  getRawEntity(): unknown;
  getConfig(): unknown;
  computeDifference(entity?: IEntity): Diff<unknown>[] | undefined;
}

export default class EntityFactory {
  static getEntity<
    T extends DataTreeEntity,
    K extends DataTreeEntityConfig | undefined,
  >(entity: T, config: K, classLoader: EntityClassLoader): IEntity {
    const { DiffGenerator, Parser } = classLoader.load(entity);
    if (isWidget(entity)) {
      return new WidgetEntity(
        entity,
        config as TWidgetEntityConfig,
        new Parser(),
        new DiffGenerator(),
      );
    } else if (isJSAction(entity)) {
      return new JSEntity(
        entity,
        config as TJSActionEntityConfig,
        new Parser(),
        new DiffGenerator(),
      );
    } else if (isAction(entity)) {
      return new ActionEntity(
        entity,
        config as TActionEntityConfig,
        new Parser(),
        new DiffGenerator(),
      );
    } else if (isAppsmith(entity)) {
      return new AppsmithEntity(
        entity,
        undefined,
        new Parser(),
        new DiffGenerator(),
      );
    } else {
      return new PagelistEntity(entity as TPageListEntity, undefined);
    }
  }
}

export class ActionEntity implements IEntity {
  private entity: TActionEntity;
  private config: TActionEntityConfig;
  entityParser: EntityParser;
  diffGenerator: EntityDiffGenerator = defaultDiffGenerator;
  constructor(
    entity: TActionEntity,
    config: TActionEntityConfig,
    entityParser: EntityParser,
    diffGenerator: EntityDiffGenerator,
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
    return this.entityParser.parse(this.entity, this.config).parsedEntity;
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
  computeDifference(oldEntity?: IEntity): Diff<unknown>[] | undefined {
    return this.diffGenerator.generate(oldEntity, this);
  }
}

export class WidgetEntity implements IEntity {
  private entity: TWidgetEntity;
  private config: TWidgetEntityConfig;
  entityParser: EntityParser;
  diffGenerator: EntityDiffGenerator = defaultDiffGenerator;
  constructor(
    entity: TWidgetEntity,
    config: TWidgetEntityConfig,
    entityParser: EntityParser,
    diffGenerator: EntityDiffGenerator,
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
    return this.entityParser.parse(this.entity, this.config).parsedEntity;
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
  computeDifference(oldEntity?: IEntity): Diff<unknown>[] | undefined {
    return this.diffGenerator.generate(oldEntity, this);
  }
}

export class JSEntity implements IEntity {
  entity: TJSActionEntity;
  private config: TJSActionEntityConfig;
  entityParser: EntityParser;
  diffGenerator: EntityDiffGenerator = defaultDiffGenerator;

  constructor(
    entity: TJSActionEntity,
    config: TJSActionEntityConfig,
    entityParser: EntityParser,
    diffGenerator: EntityDiffGenerator,
  ) {
    entityParser.parse(entity, config);
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
  computeDifference(oldEntity?: IEntity): Diff<unknown>[] | undefined {
    return this.diffGenerator.generate(oldEntity, this);
  }
  getFns() {
    const jsFunctions = [];
    const { parsedEntity, parsedEntityConfig } = this.entityParser.parse(
      this.entity,
      this.config,
    );
    for (const propertyName of Object.keys(parsedEntityConfig)) {
      const jsPropertyConfig = parsedEntityConfig[
        propertyName
      ] as TParsedJSProperty;
      const jsPropertyFullName = `${this.getName()}.${propertyName}`;
      if (!isJSFunctionProperty(jsPropertyConfig)) continue;
      jsFunctions.push({
        name: jsPropertyFullName,
        body: parsedEntity[propertyName],
        isMarkedAsync: jsPropertyConfig.isMarkedAsync,
      });
    }
    return jsFunctions;
  }
}
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

export class AppsmithEntity implements IEntity {
  private entity: TAppsmithEntity;
  private config: undefined;
  entityParser: EntityParser;
  diffGenerator: EntityDiffGenerator;
  constructor(
    entity: TAppsmithEntity,
    config: undefined,
    entityParser: EntityParser,
    diffGenerator: EntityDiffGenerator,
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
  computeDifference(oldEntity?: IEntity): Diff<unknown>[] | undefined {
    return this.diffGenerator.generate(oldEntity, this);
  }
}

export function isJSEntity(entity: IEntity): entity is JSEntity {
  return entity.getType() === ENTITY_TYPE.JSACTION;
}
export function isActionEntity(entity: IEntity): entity is ActionEntity {
  return entity.getType() === ENTITY_TYPE.ACTION;
}
export function isAppsmithEntity(entity: IEntity): entity is AppsmithEntity {
  return entity.getType() === ENTITY_TYPE.APPSMITH;
}
export function isWidgetEntity(entity: IEntity): entity is WidgetEntity {
  return entity.getType() === ENTITY_TYPE.WIDGET;
}
export function isPagelistEntity(entity: IEntity): entity is PagelistEntity {
  return entity.getType() === ENTITY_TYPE.PAGELIST;
}

// only Widgets, jsActions and Actions have paths that can be dynamic
export function isDynamicEntity(
  entity: IEntity,
): entity is JSEntity | WidgetEntity | ActionEntity {
  return [
    ENTITY_TYPE.JSACTION,
    ENTITY_TYPE.WIDGET,
    ENTITY_TYPE.ACTION,
  ].includes(entity.getType());
}
