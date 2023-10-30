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
import type { PagelistEntity } from "./PagelistEntity";

export default class EntityFactory {
  static getEntity<
    T extends DataTreeEntity,
    K extends DataTreeEntityConfig | undefined,
  >(entity: T, config: K, classLoader: EntityClassLoader): IEntity {
    const { DiffGenerator, Parser } = classLoader.load(
      entity as DataTreeEntity,
    );
    let entityConstructor = entityConstructorMap[ENTITY_TYPE.PAGELIST];
    if (!("ENTITY_TYPE" in entity)) {
      // Pagelist entity doesn't have ENTITY_TYPE property
      return entityConstructor({ entity, config, Parser, DiffGenerator });
    }
    entityConstructor = entityConstructorMap[entity.ENTITY_TYPE];
    return entityConstructor({ entity, config, Parser, DiffGenerator });
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
