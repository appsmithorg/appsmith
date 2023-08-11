import type {
  WidgetEntity as TWidgetEntity,
  WidgetEntityConfig as TWidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { EntityParser } from "plugins/utils/entityParser";
import type { Diff } from "deep-diff";
import type { IEntity } from ".";
import { ENTITY_TYPE } from ".";
import {
  defaultDiffGenerator,
  type EntityDiffGenerator,
} from "../entityDiffGenerator";

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
