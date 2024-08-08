import type {
  ActionEntity as TActionEntity,
  ActionEntityConfig as TActionEntityConfig,
} from "ee/entities/DataTree/types";
import {
  defaultDiffGenerator,
  type EntityDiffGenerator,
} from "plugins/Linting/utils/diffGenerator";
import type { EntityParser } from "plugins/Linting/utils/entityParser";
import { ENTITY_TYPE, type IEntity } from "ee/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";

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
