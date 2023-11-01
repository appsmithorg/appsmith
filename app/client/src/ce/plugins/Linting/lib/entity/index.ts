import type {
  WidgetEntity as TWidgetEntity,
  AppsmithEntity as TAppsmithEntity,
  DataTreeEntityConfig,
  WidgetEntityConfig as TWidgetEntityConfig,
  JSActionEntity as TJSActionEntity,
  ActionEntity as TActionEntity,
  PagelistEntity as TPageListEntity,
  ActionEntityConfig as TActionEntityConfig,
  JSActionEntityConfig as TJSActionEntityConfig,
} from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { EntityClassLoader } from "plugins/Linting/lib/entity/EntityTree";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";
import { JSEntity } from "plugins/Linting/lib/entity/JSActionEntity";
import { ActionEntity } from "plugins/Linting/lib/entity/ActionEntity";
import { AppsmithEntity } from "plugins/Linting/lib/entity/AppsmithEntity";
import { WidgetEntity } from "plugins/Linting/lib/entity/WidgetEntity";
import { PagelistEntity } from "plugins/Linting/lib/entity/PagelistEntity";
import {
  isAction,
  isAppsmithEntity as isAppsmith,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";

export default class EntityFactory {
  static getEntity<
    T extends DataTreeEntity,
    K extends DataTreeEntityConfig | undefined,
  >(entity: T, config: K, classLoader: EntityClassLoader): IEntity {
    const { DiffGenerator, Parser } = classLoader.load(
      entity as DataTreeEntity,
    );
    if (isWidget(entity)) {
      return new WidgetEntity(
        entity as TWidgetEntity,
        config as TWidgetEntityConfig,
        new Parser(),
        new DiffGenerator(),
      );
    } else if (isJSAction(entity)) {
      return new JSEntity(
        entity as TJSActionEntity,
        config as TJSActionEntityConfig,
        new Parser(),
        new DiffGenerator(),
      );
    } else if (isAction(entity)) {
      return new ActionEntity(
        entity as TActionEntity,
        config as TActionEntityConfig,
        new Parser(),
        new DiffGenerator(),
      );
    } else if (isAppsmith(entity)) {
      return new AppsmithEntity(
        entity as TAppsmithEntity,
        undefined,
        new Parser(),
        new DiffGenerator(),
      );
    } else {
      return new PagelistEntity(entity as TPageListEntity, undefined);
    }
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
