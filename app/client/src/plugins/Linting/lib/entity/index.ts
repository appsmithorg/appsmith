import type { DataTreeEntityConfig } from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { EntityClassLoader } from "./EntityTree";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";
import { entityConstructorMap } from "@appsmith/plugins/Linting/lib/entity/entityConstructorMap";
import type { JSEntity } from "./JSActionEntity";
import type { ActionEntity } from "./ActionEntity";
import type { AppsmithEntity } from "./AppsmithEntity";
import type { WidgetEntity } from "./WidgetEntity";

export default class EntityFactory {
  static getEntity<
    T extends DataTreeEntity,
    K extends DataTreeEntityConfig | undefined,
  >(entity: T, config: K, classLoader: EntityClassLoader): IEntity {
    const { DiffGenerator, Parser } = classLoader.load(
      entity as DataTreeEntity,
    );
    return entityConstructorMap[entity.ENTITY_TYPE]({
      entity,
      config,
      Parser,
      DiffGenerator,
    });
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
