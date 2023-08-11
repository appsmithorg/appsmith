import {
  isAction,
  isAppsmithEntity as isAppsmith,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  PagelistEntity as TPageListEntity,
  ActionEntityConfig as TActionEntityConfig,
  JSActionEntityConfig as TJSActionEntityConfig,
} from "entities/DataTree/types";
import type {
  DataTreeEntityConfig,
  DataTreeEntity,
  WidgetEntityConfig as TWidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { Diff } from "deep-diff";
import type { EntityClassLoader } from "plugins/utils/entityClassLoader";
import { WidgetEntity } from "./WidgetEntity";
import { ActionEntity } from "./ActionEntity";
import { JSEntity } from "./JSEntity";
import { AppsmithEntity } from "./AppsmithEntity";
import { PagelistEntity } from "./PagelistEntity";

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

export enum ENTITY_TYPE {
  ACTION = "ACTION",
  WIDGET = "WIDGET",
  APPSMITH = "APPSMITH",
  JSACTION = "JSACTION",
  PAGELIST = "PAGELIST",
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
