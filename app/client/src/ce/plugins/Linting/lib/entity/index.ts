import type {
  DataTreeEntityConfig,
  ActionEntity as TActionEntity,
  ActionEntityConfig as TActionEntityConfig,
  AppsmithEntity as TAppsmithEntity,
  JSActionEntity as TJSActionEntity,
  JSActionEntityConfig as TJSActionEntityConfig,
  WidgetEntity as TWidgetEntity,
  WidgetEntityConfig as TWidgetEntityConfig,
} from "ee/entities/DataTree/types";
import { ENTITY_TYPE, type IEntity } from "ee/plugins/Linting/lib/entity/types";
import {
  isAction,
  isJSAction,
  isWidget,
} from "ee/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { ActionEntity } from "plugins/Linting/lib/entity/ActionEntity";
import { AppsmithEntity } from "plugins/Linting/lib/entity/AppsmithEntity";
import type { EntityClassLoader } from "plugins/Linting/lib/entity/EntityTree";
import { JSEntity } from "plugins/Linting/lib/entity/JSActionEntity";
import { WidgetEntity } from "plugins/Linting/lib/entity/WidgetEntity";

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
    } else {
      return new AppsmithEntity(
        entity as TAppsmithEntity,
        undefined,
        new Parser(),
        new DiffGenerator(),
      );
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
