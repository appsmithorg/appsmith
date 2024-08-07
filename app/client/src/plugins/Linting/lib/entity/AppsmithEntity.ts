import type { AppsmithEntity as TAppsmithEntity } from "ee/entities/DataTree/types";
import type { EntityDiffGenerator } from "plugins/Linting/utils/diffGenerator";
import type { EntityParser } from "plugins/Linting/utils/entityParser";
import { ENTITY_TYPE, type IEntity } from "ee/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";

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
