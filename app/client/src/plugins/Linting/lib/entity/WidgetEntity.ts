import type {
  WidgetEntity as TWidgetEntity,
  WidgetEntityConfig as TWidgetEntityConfig,
} from "ee/entities/DataTree/types";
import {
  defaultDiffGenerator,
  type EntityDiffGenerator,
} from "plugins/Linting/utils/diffGenerator";
import type { EntityParser } from "plugins/Linting/utils/entityParser";
import { ENTITY_TYPE, type IEntity } from "ee/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";

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
  getType() {
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
