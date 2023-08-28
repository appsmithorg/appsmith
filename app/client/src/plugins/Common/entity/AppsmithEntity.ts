import type { AppsmithEntity as TAppsmithEntity } from "entities/DataTree/dataTreeFactory";
import type { EntityDiffGenerator } from "plugins/Common/entityDiffGenerator";
import type { EntityParser } from "plugins/Common/entityParser";
import type { Diff } from "deep-diff";
import type { IEntity } from ".";
import { ENTITY_TYPE } from ".";

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
  isEqual(_: TAppsmithEntity): boolean {
    return false;
  }
}
